export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

//Fuses
export const FUSES = {
  CAN_DO_EVERYTHING:       0,
  CANNOT_UNWRAP:           1,
  CANNOT_BURN_FUSES:       2,
  CANNOT_TRANSFER:         4,
  CANNOT_SET_RESOLVER:     8,
  CANNOT_SET_TTL:          16,
  CANNOT_CREATE_SUBDOMAIN: 32,
  CANNOT_APPROVE:          64,
  PARENT_CANNOT_CONTROL:   2 ** 16,
  IS_DOT_ETH:              2 ** 17,
  CAN_EXTEND_EXPIRY:       2 ** 18,
}

export const PARENT_CONTROLLED_FUSES   = 0xFFFF0000;
// all fuses apart from IS_DOT_ETH
export const USER_SETTABLE_FUSES       = 0xFFFDFFFF;

//Useful constants
export const DAY                       = 86400
export const GRACE_PERIOD              = 90 * DAY

export const ONE_YEAR_IN_SECONDS              = 31536000

export const OPTIMISM_CHAIN_ID = 420;
export const ETHEREUM_CHAIN_ID = 5;