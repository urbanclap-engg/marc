import crypto from 'crypto';
import _ from 'lodash';

const ALGO = 'sha256';
const ENCODING = 'base64';

/**
 * This function generates token for
 * a given id and salt.
 *
 * @param {any} id
 * @param {string} salt
 * @return {string}
 */
function generateToken(id, salt) {
  salt = salt.toString();
  return crypto.createHmac(ALGO, id)
    .update(salt)
    .digest(ENCODING);
}

/**
 * Generates token if token format is
 * of the older version of auth.
 * @param token
 * @returns {string}
 */
function hashOldVersionToken(token) {
  let tokenArr = token.split('|');
  let id = tokenArr[0];
  let salt = tokenArr[1];
  return generateToken(id, salt);
}

export const AuthUtility = {
  getToken: ( {authorization = ''} = {} ) => {
    let token = authorization;
    token = token.replace(/^Bearer /, '')
    token = token.includes('|') ? hashOldVersionToken(token) : token
    return token;
  }
};
