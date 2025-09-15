export const SPICE_CONFIG = {
  INITIAL_BONUS: parseInt(process.env.SPICE_INITIAL_BONUS || '100'),
  TEXT_RESPONSE_COST: parseInt(process.env.SPICE_TEXT_RESPONSE_COST || '1'),
  IMAGE_GENERATION_COST: parseInt(process.env.SPICE_IMAGE_GENERATION_COST || '30'),
  VIDEO_GENERATION_COST: parseInt(process.env.SPICE_VIDEO_GENERATION_COST || '50'),
  INVITER_BONUS: parseInt(process.env.SPICE_INVITER_BONUS || '100'),
  INVITEE_BONUS: parseInt(process.env.SPICE_INVITEE_BONUS || '100'),
};
