'use strict';
const fs = require('fs');
const path = require('path');

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');

/**
 * ReadAssetワークロードクラス
 * Caliperがこのクラスを通じて、既存のアセットを読み取るベンチマークを実行します。
 */
class ReadAssetWorkload extends WorkloadModuleBase {
    constructor() {
        super();
        this.assetIDs = []; // 読み取るアセットIDの一覧を格納
        this.txIndex = 0;    // 各ワーカーが生成するトランザクションの番号
    }

    /**
     * 各ワーカーごとの初期化処理。
     * 主にcreate-assetワークロードが生成してアセットIDをファイル読み込みし、ローカルに保持します。
     * @param {number} workerIndex ワーカーのインデックス
     * @param {number} totalWorkers 総ワーカー数
     * @param {number} roundIndex 現在のround番号
     * @param {Object} roundArguments ラウンド毎の引数（使用しない）
     * @param {Object} sutAdapter CaliperのSUT（System Under Test）アダプター
     * @param {Object} sutContext Caliperで共有されるcontextオブジェクト
     */
    async initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext) {
        this.workerIndex = workerIndex;
        this.totalWorkers = totalWorkers;
        this.roundIndex = roundIndex;
        this.sutAdapter = sutAdapter;

        const filePath = path.join(__dirname, `assets_worker${this.workerIndex}.json`);
        if (!fs.existsSync(filePath)) {
            throw new Error('No assetIDs available in shared context for reading.');
        }

        const data = fs.readFileSync(filePath);
        this.assetIDs = JSON.parse(data);
    }

    /**
     * 各トランザクションの処理（ReadAssetを呼び出す）
     */
    async submitTransaction() {
        // ラウンドロビン方式でassetIDを選択（IDが尽きたら再利用（read onlyなので安全））
        const assetID = this.assetIDs[this.txIndex % this.assetIDs.length];
        this.txIndex++;

        const args = [assetID];

        // 読み取りトランザクションを送信（readOnly: true により高速）
        await this.sutAdapter.sendRequests({
            contractId: 'basic',            // デプロイ済みチェインコード名
            contractFunction: 'ReadAsset',  // チェインコードの関数名
            invokerIdentity: 'User1',       // 利用するID（networkConfig.yamlで指定）
            contractArguments: args,        // 引数としてassetIDを渡す
            readOnly: true                  // 読み取り専用で高速ルートが使われる
        });
    }
}

/**
 * Caliperが呼び出すエントリポイント関数
 * @returns {WorkloadModuleBase} ReadAssetワークロードインスタンス
 */
function createWorkloadModule() {
    return new ReadAssetWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;
