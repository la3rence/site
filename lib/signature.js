/** PK Fixed version.
 * Activitypub HTTP Signatures
 * Based on [HTTP Signatures draft 08](https://datatracker.ietf.org/doc/html/draft-cavage-http-signatures-08)
 * @module activitypub-http-signatures
 */

import crypto from "crypto";

// token definitions from definitions in rfc7230 and rfc7235
const token = String.raw`[!#$%&'\*+\-\.\^_\`\|~0-9a-z]+`; // Key or value
const qdtext = String.raw`[^"\\\x7F]`; // Characters that don't need escaping
const quotedPair = String.raw`\\[\t \x21-\x7E\x80-\xFF]`; // Escaped characters
const quotedString = `(?:${qdtext}|${quotedPair})*`;
const fieldMatch = new RegExp(
  String.raw`(?<=^|,\s*)(${token})\s*=\s*(?:(${token})|"(${quotedString})")(?=,|$)`,
  "ig",
);
const parseSigFields = str =>
  Object.fromEntries(
    Array.from(str.matchAll(fieldMatch)).map(
      // capture groups: 1=fieldname, 2=field value if unquoted, 3=field value if quoted
      v => [v[1], v[2] ?? v[3].replace(/\\./g, c => c[1])],
    ),
  );

const defaultHeaderNames = ["(request-target)", "host", "date"];

/**
 * @private
 * Generate the string to be signed for the signature header
 * @param {Object}	options	Options
 * @param {string}	options.target	The pathname of the request URL (including query and hash strings)
 * @param {string}	options.method	The HTTP request method
 * @param {object}	options.headers	Object whose keys are http header names and whose values are those headers' values
 * @param {string[]}	headerNames	Names of the headers to use in the signature
 * @returns {string}
 */
function getSignString({ target, method, headers }, headerNames) {
  const requestTarget = `${method.toLowerCase()} ${target}`;
  headers = {
    ...headers,
    "(request-target)": requestTarget,
  };
  return headerNames
    .map(header => `${header.toLowerCase()}: ${headers[header]}`)
    .join("\n");
}

export class Sha256Signer {
  #publicKeyId;
  #privateKey;
  #headerNames;

  /**
   * Class for signing a request and returning the signature header
   * @param {object}	options	Config options
   * @param {string}	options.publicKeyId	URI for public key that must be used for verification
   * @param {string}	options.privateKey	Private key to use for signing
   * @param {string[]}	options.headerNames	Names of headers to use in generating signature
   */
  constructor({ publicKeyId, privateKey, headerNames }) {
    this.#publicKeyId = publicKeyId;
    this.#privateKey = privateKey;
    this.#headerNames = headerNames ?? defaultHeaderNames;
  }

  /**
   * Generate the signature header for an outgoing message
   * @param	{object}	reqOptions	Request options
   * @param	{string}	reqOptions.url	The full URL of the request to sign
   * @param	{string}	reqOptions.method	Method of the request
   * @param	{object}	reqOptions.headers	Dict of headers used in the request
   * @returns	{string}	Value for the signature header
   */
  sign({ url, method, headers }) {
    const { host, pathname, search } = new URL(url);
    const target = `${pathname}${search}`;
    headers.date = headers.date || new Date().toUTCString();
    headers.host = headers.host || host;

    const headerNames = this.#headerNames;

    const stringToSign = getSignString(
      { target, method, headers },
      headerNames,
    );

    const signature = this.#signSha256(this.#privateKey, stringToSign).toString(
      "base64",
    );

    return `keyId="${this.#publicKeyId}",headers="${headerNames.join(
      " ",
    )}",signature="${signature.replace(/"/g, '\\"')}",algorithm="rsa-sha256"`;
  }

  /**
   * @private
   * Sign a string with a private key using sha256 alg
   * @param {string} privateKey Private key
   * @param {string} stringToSign String to sign
   * @returns {Buffer} Signature buffer
   */
  #signSha256(privateKey, stringToSign) {
    const signer = crypto.createSign("sha256");
    signer.update(stringToSign);
    const signature = signer.sign(privateKey);
    signer.end();
    return signature;
  }
}

/**
 * Incoming request parser and Signature factory.
 * If you wish to support more signature types you can extend this class
 * and overide getSignatureClass.
 */
export class Parser {
  /**
   * Parse an incomming request's http signature header
   * @param	{object}	reqOptions	Request options
   * @param	{string}	reqOptions.url	The pathname (and query string) of the request URL
   * @param	{string}	reqOptions.method	Method of the request
   * @param	{object}	reqOptions.headers	Dict of headers used in the request
   * @returns {Signature} Object representing the signature
   * @throws	{UnkownAlgorithmError}	If the algorithm used isn't one we know how to verify
   */
  parse({ headers, method, url }) {
    const fields = parseSigFields(headers.signature);
    const headerNames = (fields.headers ?? "date").split(/\s+/);
    const signature = Buffer.from(fields.signature, "base64");
    const signString = getSignString(
      { target: url, method, headers },
      headerNames,
    );
    const keyId = fields.keyId;
    const algorithm = fields.algorithm ?? "rsa-sha256";

    return this.getSignatureClass(algorithm, {
      signature,
      string: signString,
      keyId,
    });
  }

  /**
   * Construct the signature class for a given algorithm.
   * Override this method if you want to support additional
   * algorithms.
   * @param	{string}	algorithm The algorithm used by the signed request
   * @param	{object}	options
   * @param	{Buffer}	options.signature	The signature as a buffer
   * @param	{string}	options.string	The string that was signed
   * @param	{string}	options.keyId	The ID of the public key to be used for verification
   * @returns	{Signature}
   * @throws	{UnkownAlgorithmError}	If an unknown algorithm was used
   */
  getSignatureClass(algorithm, { signature, string, keyId }) {
    if (algorithm === "rsa-sha256") {
      return new Sha256Signature({ signature, string, keyId });
    } else {
      throw new UnkownAlgorithmError(
        `Don't know how to verify ${algorithm} signatures.`,
      );
    }
  }
}

export class UnkownAlgorithmError extends Error {}

export class Signature {
  #keyId;

  constructor(keyId) {
    this.#keyId = keyId;
  }

  get keyId() {
    return this.#keyId;
  }

  verify(key) {
    console.log(key);
    return false;
  }
}

export class Sha256Signature extends Signature {
  #signature;
  #string;

  /**
   * Class representing the HTTP signature
   * @param	{object}	options
   * @param	{Buffer}	options.signature	The signature as a buffer
   * @param	{string}	options.string	The string that was signed
   * @param	{string}	options.keyId	The ID of the public key to be used for verification
   */
  constructor({ signature, string, keyId }) {
    super(keyId);
    this.#signature = signature;
    this.#string = string;
  }

  /**
   * @property {string} keyId The ID of the public key that can verify the signature
   */

  /**
   * Verify the signature using a public key
   * @param	{string} key The public key matching the signature's keyId
   * @returns	{boolean}
   */
  verify(key) {
    const signature = this.#signature;
    const signedString = this.#string;
    const verifier = crypto.createVerify("sha256");
    verifier.write(signedString);
    verifier.end();

    return verifier.verify(key, signature);
  }
}

export function verifySignature(signature, publicKeyJson) {
  let signatureValid;
  try {
    signatureValid = signature.verify(publicKeyJson.publicKeyPem);
  } catch (error) {
    console.log("Signature Verification error", error);
  }
  return signatureValid;
}

export default new Parser();
