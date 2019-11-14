/* global artifacts contract beforeEach it assert */

const { assertRevert } = require('@aragon/test-helpers/assertThrow')
const { getEventArgument } = require('@aragon/test-helpers/events')
const { hash } = require('eth-ens-namehash')
const deployDAO = require('./helpers/deployDAO')

const Counter = artifacts.require('Counter.sol')

contract('Counter', ([appManager, user, anyone]) => {
  let app

  beforeEach('deploy dao and app', async () => {
    const { dao, acl } = await deployDAO(appManager)

    // Deploy the app's base contract.
    const appBase = await Counter.new()

    // Instantiate a proxy for the app, using the base contract as its logic implementation.
    const instanceReceipt = await dao.newAppInstance(
      hash('counter.aragonpm.test'), // appId - Unique identifier for each app installed in the DAO; can be any bytes32 string in the tests.
      appBase.address, // appBase - Location of the app's base implementation.
      '0x', // initializePayload - Used to instantiate and initialize the proxy in the same call (if given a non-empty bytes string).
      false, // setDefault - Whether the app proxy is the default proxy.
      { from: appManager }
    )
    app = await Counter.at(
      getEventArgument(instanceReceipt, 'NewAppProxy', 'proxy')
    )

    // Set up the app's permissions.
    await acl.createPermission(
      user,
      app.address,
      await app.DECREMENT_ROLE(),
      appManager,
      { from: appManager }
    )

    await app.initialize()
  })

  it('should allow any address to increment the counter', async () => {
    await app.increment({ from: anyone })
    assert.equal(await app.value(), 1)
  })

  it('should not allow any address to decrement the counter', async () => {
    await app.increment({ from: anyone })
    await assertRevert(
      app.decrement({ from: anyone }),
      'Returned error:  APP_AUTH_FAILED'
    )
    assert.equal(await app.value(), 1)
  })

  it('should allow authorized users to decrement the counter', async () => {
    await app.increment({ from: user })
    await app.decrement({ from: user })
    assert.equal(await app.value(), 0)
  })
})