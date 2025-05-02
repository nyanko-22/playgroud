'use strict';

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');

class CreateAssetWorkload extends WorkloadModuleBase {
    constructor() {
        super();
    }

    async submitTransaction() {
        const assetID = `asset_${this.workerIndex}_${Date.now()}`;
        await this.sutAdapter.sendRequests({
            contractId: 'basic',
            contractFunction: 'CreateAsset',
            invokerIdentity: 'User1',
            contractArguments: [assetID, 'blue', '5', 'Alice', '100'],
            readOnly: false,
        });
    }
}

function createWorkloadModule() {
    return new CreateAssetWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;

