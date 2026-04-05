// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CBDCToken
 * @notice Zentral kontrollierter CBDC-Token mit RBAC, Limits, Freeze und Batch-Logik (Ablauf/Zweck).
 */
contract CBDCToken is ERC20, AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant CENTRAL_BANK_ROLE = keccak256("CENTRAL_BANK_ROLE");
    bytes32 public constant BANK_ROLE = keccak256("BANK_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");
    bytes32 public constant USER_ROLE = keccak256("USER_ROLE");

    struct Batch {
        uint256 amount;
        uint256 expiryTimestamp;
        bytes32 purpose;
    }

    mapping(address => Batch[]) private _batches;
    mapping(address => bool) private _frozen;

    uint256 private _globalTxLimit;
    mapping(address => uint256) public dailyLimit;
    mapping(address => uint256) private _daySpent;
    mapping(address => uint256) private _dayNumber;

    bool private _suppressBatchHooks;
    bool private _inForceTransfer;

    event TokensMinted(address indexed to, uint256 amount, address indexed by);
    event TokensBurned(address indexed from, uint256 amount, address indexed by);
    event AccountFrozen(address indexed user, address indexed by);
    event AccountUnfrozen(address indexed user, address indexed by);
    event ForceTransfer(address indexed from, address indexed to, uint256 amount);
    event LimitSet(address indexed user, uint256 limit);

    error CBDC__NotUserRole();
    error CBDC__ZeroAddress();

    modifier onlyCentralBankOrCompliance() {
        require(
            hasRole(CENTRAL_BANK_ROLE, _msgSender()) || hasRole(COMPLIANCE_ROLE, _msgSender()),
            "CBDC: not central bank or compliance"
        );
        _;
    }

    constructor(string memory name_, string memory symbol_, address centralBank) ERC20(name_, symbol_) {
        if (centralBank == address(0)) revert CBDC__ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, centralBank);
        _grantRole(CENTRAL_BANK_ROLE, centralBank);
    }

    function pause() external onlyRole(CENTRAL_BANK_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(CENTRAL_BANK_ROLE) {
        _unpause();
    }

    function mint(address to, uint256 amount) external onlyRole(CENTRAL_BANK_ROLE) nonReentrant whenNotPaused {
        require(to != address(0), "CBDC: mint to zero");
        require(amount > 0, "CBDC: zero amount");
        _appendBatch(to, amount, 0, 0);
        _mint(to, amount);
        emit TokensMinted(to, amount, _msgSender());
    }

    function burn(address from, uint256 amount) external onlyRole(CENTRAL_BANK_ROLE) nonReentrant whenNotPaused {
        require(from != address(0), "CBDC: burn from zero");
        require(amount > 0, "CBDC: zero amount");
        _burn(from, amount);
        emit TokensBurned(from, amount, _msgSender());
    }

    function mintWithExpiry(address to, uint256 amount, uint256 expiryTimestamp)
        external
        onlyRole(CENTRAL_BANK_ROLE)
        nonReentrant
        whenNotPaused
    {
        require(to != address(0), "CBDC: mint to zero");
        require(amount > 0, "CBDC: zero amount");
        require(expiryTimestamp > block.timestamp, "CBDC: expiry not in future");
        _appendBatch(to, amount, expiryTimestamp, bytes32(0));
        _mint(to, amount);
        emit TokensMinted(to, amount, _msgSender());
    }

    function mintWithPurpose(address to, uint256 amount, bytes32 purpose)
        external
        onlyRole(CENTRAL_BANK_ROLE)
        nonReentrant
        whenNotPaused
    {
        require(to != address(0), "CBDC: mint to zero");
        require(amount > 0, "CBDC: zero amount");
        require(purpose != bytes32(0), "CBDC: empty purpose");
        _appendBatch(to, amount, 0, purpose);
        _mint(to, amount);
        emit TokensMinted(to, amount, _msgSender());
    }

    function transfer(address to, uint256 amount) public override whenNotPaused nonReentrant returns (bool) {
        if (!hasRole(USER_ROLE, _msgSender())) revert CBDC__NotUserRole();
        return super.transfer(to, amount);
    }

    function transferFrom(address from, address to, uint256 amount)
        public
        override
        whenNotPaused
        nonReentrant
        returns (bool)
    {
        if (!hasRole(USER_ROLE, _msgSender())) revert CBDC__NotUserRole();
        return super.transferFrom(from, to, amount);
    }

    function forceTransfer(address from, address to, uint256 amount)
        external
        onlyRole(CENTRAL_BANK_ROLE)
        nonReentrant
    {
        require(from != address(0) && to != address(0), "CBDC: invalid addresses");
        require(amount > 0, "CBDC: zero amount");
        _inForceTransfer = true;
        _transfer(from, to, amount);
        _inForceTransfer = false;
        emit ForceTransfer(from, to, amount);
    }

    function freezeAccount(address user) external onlyCentralBankOrCompliance {
        require(user != address(0), "CBDC: zero address");
        require(!_frozen[user], "CBDC: already frozen");
        _frozen[user] = true;
        emit AccountFrozen(user, _msgSender());
    }

    function unfreezeAccount(address user) external onlyCentralBankOrCompliance {
        require(user != address(0), "CBDC: zero address");
        require(_frozen[user], "CBDC: not frozen");
        _frozen[user] = false;
        emit AccountUnfrozen(user, _msgSender());
    }

    function isAccountFrozen(address user) external view returns (bool) {
        return _frozen[user];
    }

    function setTransactionLimit(uint256 limit) external onlyRole(CENTRAL_BANK_ROLE) {
        _globalTxLimit = limit;
        emit LimitSet(address(0), limit);
    }

    function transactionLimit() external view returns (uint256) {
        return _globalTxLimit;
    }

    function setDailyLimit(address user, uint256 limit) external onlyRole(BANK_ROLE) {
        require(user != address(0), "CBDC: zero address");
        dailyLimit[user] = limit;
        emit LimitSet(user, limit);
    }

    function batchCount(address account) external view returns (uint256) {
        return _batches[account].length;
    }

    function batchAt(address account, uint256 index) external view returns (uint256 amount, uint256 expiryTimestamp, bytes32 purpose) {
        Batch storage b = _batches[account][index];
        return (b.amount, b.expiryTimestamp, b.purpose);
    }

    function _update(address from, address to, uint256 value) internal override {
        if (_suppressBatchHooks) {
            super._update(from, to, value);
            return;
        }

        if (from != address(0) && to != address(0)) {
            if (!_inForceTransfer) {
                require(!_frozen[from], "CBDC: sender frozen");
                require(!_frozen[to], "CBDC: recipient frozen");
                if (_globalTxLimit > 0) {
                    require(value <= _globalTxLimit, "CBDC: exceeds transaction limit");
                }
                _assertDailyLimit(from, value);
            }
            _pruneExpired(from);
            _moveBatches(from, to, value);
            super._update(from, to, value);
            if (!_inForceTransfer) {
                _increaseDailySpend(from, value);
            }
            return;
        }

        if (to == address(0) && from != address(0)) {
            // Burn (nur CENTRAL_BANK_ROLE): auch von eingefrorenen Konten erlaubt
            _pruneExpired(from);
            _consumeBatchesForBurn(from, value);
            super._update(from, to, value);
            return;
        }

        if (from == address(0) && to != address(0)) {
            super._update(from, to, value);
            return;
        }

        super._update(from, to, value);
    }

    function _appendBatch(address to, uint256 amount, uint256 expiryTimestamp, bytes32 purpose) internal {
        _batches[to].push(Batch({amount: amount, expiryTimestamp: expiryTimestamp, purpose: purpose}));
    }

    function _pruneExpired(address account) internal {
        uint256 len = _batches[account].length;
        for (uint256 i = 0; i < len; ) {
            Batch storage b = _batches[account][i];
            if (b.amount > 0 && b.expiryTimestamp != 0 && block.timestamp >= b.expiryTimestamp) {
                uint256 amt = b.amount;
                b.amount = 0;
                _suppressBatchHooks = true;
                super._update(account, address(0), amt);
                _suppressBatchHooks = false;
                _compactBatches(account);
                len = _batches[account].length;
                i = 0;
                continue;
            }
            unchecked {
                ++i;
            }
        }
    }

    function _compactBatches(address account) internal {
        Batch[] storage arr = _batches[account];
        uint256 w = 0;
        for (uint256 r = 0; r < arr.length; ) {
            if (arr[r].amount > 0) {
                if (w != r) {
                    arr[w] = arr[r];
                }
                unchecked {
                    ++w;
                    ++r;
                }
            } else {
                unchecked {
                    ++r;
                }
            }
        }
        while (arr.length > w) {
            arr.pop();
        }
    }

    function _consumeBatchesForBurn(address from, uint256 amount) internal {
        uint256 remaining = amount;
        uint256 i = 0;
        while (remaining > 0 && i < _batches[from].length) {
            Batch storage b = _batches[from][i];
            if (b.amount == 0) {
                unchecked {
                    ++i;
                }
                continue;
            }
            uint256 take = b.amount <= remaining ? b.amount : remaining;
            b.amount -= take;
            remaining -= take;
            if (b.amount == 0) {
                unchecked {
                    ++i;
                }
            }
        }
        require(remaining == 0, "CBDC: batch ledger underflow");
        _compactBatches(from);
    }

    function _moveBatches(address from, address to, uint256 amount) internal {
        uint256 remaining = amount;
        uint256 i = 0;
        while (remaining > 0 && i < _batches[from].length) {
            Batch storage b = _batches[from][i];
            if (b.amount == 0) {
                unchecked {
                    ++i;
                }
                continue;
            }
            uint256 take = b.amount <= remaining ? b.amount : remaining;
            b.amount -= take;
            _appendBatch(to, take, b.expiryTimestamp, b.purpose);
            remaining -= take;
            if (b.amount == 0) {
                unchecked {
                    ++i;
                }
            }
        }
        require(remaining == 0, "CBDC: batch ledger underflow");
        _compactBatches(from);
    }

    function _assertDailyLimit(address from, uint256 value) internal view {
        uint256 lim = dailyLimit[from];
        if (lim == 0) return;
        uint256 day = block.timestamp / 1 days;
        uint256 spent = _dayNumber[from] == day ? _daySpent[from] : 0;
        require(spent + value <= lim, "CBDC: exceeds daily limit");
    }

    function _increaseDailySpend(address from, uint256 value) internal {
        uint256 lim = dailyLimit[from];
        if (lim == 0) return;
        uint256 day = block.timestamp / 1 days;
        if (_dayNumber[from] != day) {
            _dayNumber[from] = day;
            _daySpent[from] = 0;
        }
        _daySpent[from] += value;
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
