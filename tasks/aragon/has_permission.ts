import { task } from '@nomiclabs/buidler/config';

task('aragon:has_permission', 'Checks a permission in an Aragon app')
  .addParam('dao', 'Deployed DAO address')
  .addParam('permission', 'Name of the permission to set')
  .addParam('app', 'Address of the app where the permission will be set')
  .addParam('contract', 'App contract name')
  .addParam('account', 'Account who is getting the permission')
  .setAction(async ({ dao, permission, app, contract, account }, { web3, artifacts }) => {
    // Retrieve contract artifacts.
    const Kernel = artifacts.require('@aragon/core/contracts/kernel/Kernel')
    const ACL = artifacts.require('@aragon/core/contracts/acl/ACL')

    // Retrieve deployed DAO and ACL instances.
    const daoInstance = await Kernel.at(dao)
    const aclInstance = await ACL.at(await daoInstance.acl())

    // Retrieve the deployed app.
    const Contract = artifacts.require(`${contract}.sol`)
    const appInstance = await Contract.at(app)

    // Address that will own the app.
    const accounts = await web3.eth.getAccounts()
    const appManager = accounts[0]
    const role = await appInstance[permission]()
    const hasPermission = await aclInstance.hasPermission(
      account,
      appInstance.address,
      role
    )
    console.log(hasPermission)
  })
