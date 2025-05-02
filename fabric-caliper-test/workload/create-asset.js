'use strict';

// Hyperledger Caliperの基本クラスをインポート
const fs = require('fs');
const path = require('path');
const { WorkloadModuleBase } = require('@hyperledger/caliper-core');

// アセット作成のためのワークロードモジュールクラスを定義
class CreateAssetWorkload extends WorkloadModuleBase {
    constructor() {
        super(); // 親クラスの初期化
        this.txIndex = 0; // 各トランザクションの番号を管理
        this.assetIds = []; // 作成されたアセットIDを保持
        this.roundPrefix = Date.now(); // 一意なプレフィックス
    }

    /**
     * ワークロードモジュールの初期化処理
     * 各ワーカースレッドごとに呼び出される
     */
    async initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext) {
        this.workerIndex = workerIndex; // ワーカーの番号
        this.roundIndex = 0; // createとreadのラウンドで同じアセットIDにするため固定
        this.sutAdapter = sutAdapter; // Fabricとやり取りするためのアダプタ
    }

    /**
     * 各トランザクションの送信処理
     * テスト対象のチェーンコード関数を呼び出す
     */
    async submitTransaction() {
        // アセットIDをユニークに生成
        const assetID = `asset_${this.roundPrefix}_${this.workerIndex}_${this.roundIndex}_${this.txIndex++}`;

        // チェーンコードへの引数を定義（ハードコード例）
        const args = [assetID, 'blue', '20', 'Alice', '100'];

        // 作成したアセットIDをローカルに保存しておく
        this.assetIds.push(assetID);

        // Fabricネットワークにトランザクションを送信
        await this.sutAdapter.sendRequests({
            contractId: 'basic', // 使用するチェーンコード名
            contractFunction: 'CreateAsset', // 実行する関数名
            invokerIdentity: 'User1', // 実行ユーザー
            contractArguments: args, // 引数リスト
            readOnly: false // 書き込みトランザクション
        });
    }

    /**
     * テスト終了後に呼ばれる後処理
     * ReadAsset用にアセットIDをファイル出力
     */
    async cleanupWorkloadModule() {
        const filePath = path.join(__dirname, `assets_worker${this.workerIndex}.json`); // ファイル名にワーカー番号を付与
        fs.writeFileSync(filePath, JSON.stringify(this.assetIds)); // JSONファイルとして保存
    }
}

/**
 * Caliperが呼び出すエントリーポイント関数
 * ワークロードモジュールのインスタンスを返す
 */
function createWorkloadModule() {
    return new CreateAssetWorkload();
}

// このモジュールをCaliperに公開
module.exports.createWorkloadModule = createWorkloadModule;
