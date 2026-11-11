/** Asserts that `promise` reverts with the custom error `signature`, e.g. "NotIssuer(address)". */
async function expectCustomError(promise, signature) {
  const selector = web3.eth.abi.encodeFunctionSignature(signature).toLowerCase();
  const name = signature.slice(0, signature.indexOf("("));

  try {
    await promise;
  } catch (error) {
    const parts = [error.message, error.reason, error.data && String(error.data)];
    let serialized = "";
    try {
      serialized = JSON.stringify(error);
    } catch (stringifyError) {
      serialized = "";
    }

    const blob = `${parts.join("\n")}\n${serialized}`.toLowerCase();
    if (blob.includes(name.toLowerCase()) || blob.includes(selector)) {
      return;
    }

    throw new Error(`expected ${signature} (${selector}) but got: ${error.message}`);
  }

  throw new Error(`expected ${signature} but the call succeeded`);
}

async function expectRevert(promise) {
  try {
    await promise;
  } catch (error) {
    return;
  }

  throw new Error("expected revert");
}

module.exports = { expectCustomError, expectRevert };
