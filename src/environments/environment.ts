export const environment = {
  production: false,
  apiEndpoint: 'https://dev-eos-api.tokenpad.io/',
  contractName: 'treasuregame',
  // eosNet: {
  //   protocol: 'http',
  //   blockchain: 'eos',
  //   host: 'jungle.cryptolions.io',
  //   port: 18888,
  //   chainId: '038f4b0fc8ff18a4f0842a8f0564611f6e96e8535901dd45e43ac8691a1c4dca'
  // }
  eosNet: {
    protocol: 'https',
    blockchain: 'eos',
    host: 'bp.cryptolions.io',
    port: 443,
    chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906'
  }
};
