import assert from 'assert';
import {EventEmitter, once} from 'events';
import StorageWallet from '@docknetwork/wallet/storage-wallet';
import {
  validation,
  SumParams,
  CreateAccountDocumentsParams,
  serviceName,
  CreateParams,
  AddParams,
  ExportAccountParams,
  ImportWalletParams,
  QueryParams,
  RemoveParams,
  UpdateParams,
  WalletContent,
} from './configs';
import MemoryWallet from '../../wallet/memory-storage-wallet';
import RpcWallet from '../../wallet/rpc-storage-wallet';
import {keyringService} from '../keyring/service';
import {WalletDocument} from '../../types';
import {v4 as uuid} from 'uuid';

export class WalletService {
  wallet: StorageWallet;

  rpcMethods = [
    WalletService.prototype.create,
    WalletService.prototype.add,
    WalletService.prototype.exportWallet,
    WalletService.prototype.resolveCorrelations,
    WalletService.prototype.createAccountDocuments,
    WalletService.prototype.exportAccount,
    WalletService.prototype.getDocumentById,
    WalletService.prototype.load,
    WalletService.prototype.lock,
    WalletService.prototype.query,
    WalletService.prototype.remove,
    WalletService.prototype.resolveCorrelations,
    WalletService.prototype.status,
    WalletService.prototype.toJSON,
    WalletService.prototype.sync,
    WalletService.prototype.unlock,
    WalletService.prototype.update,
  ];

  constructor() {
    this.name = serviceName;
  }

  create(params: CreateParams) {
    const {walletId, type} = params;
    if (type === 'memory') {
      this.wallet = new MemoryWallet(walletId);
    } else {
      this.wallet = new RpcWallet(walletId);
    }
  }

  load() {
    this._assertWallet();

    return this.wallet.load();
  }
  sync() {
    this._assertWallet();

    return this.wallet.sync();
  }
  lock(password) {
    this._assertWallet();

    return this.wallet.lock(password);
  }
  unlock(password) {
    this._assertWallet();

    return this.wallet.unlock(password);
  }
  status() {
    this._assertWallet();

    return this.wallet.status;
  }
  toJSON() {
    this._assertWallet();

    return this.wallet.toJSON();
  }

  add(content) {
    this._assertWallet();
    validation.add(content);
    return this.wallet.add(content);
  }

  remove(content) {
    this._assertWallet();
    validation.remove(content);
    return this.wallet.remove(content);
  }

  update(content) {
    this._assertWallet();
    validation.update(content);
    return this.wallet.update(content);
  }

  query(search) {
    this._assertWallet();
    validation.query(search);
    return this.wallet.query(search);
  }
  exportWallet(password) {
    this._assertWallet();
    return this.wallet.export(password);
  }
  /**
   *
   * @param {*} param0
   * @returns
   */
  importWallet({data, password}: ImportWalletParams) {
    this._assertWallet();
    validation.importWallet(params);
    return this.wallet.import(data, password);
  }
  /**
   *
   * @param {*} params
   * @returns
   */
  async exportAccount(params: ExportAccountParams) {
    this._assertWallet();
    validation.exportAccount(params);

    const {address, password} = params;
    const pair = await this.getAccountKeypair(address);

    return pair.toJson(password);
  }
  /**
   *
   * @param {*} params
   * @returns
   */
  async createAccountDocuments(params: CreateAccountDocumentsParams) {
    this._assertWallet();
    validation.createAccountDocuments(params);

    const {
      name,
      type = 'sr25519',
      derivePath,
      mnemonic,
      json,
      password,
    } = params;

    const keyringPair = json
      ? keyringService.addFromJson({jsonData: json, password})
      : keyringService.getKeyringPair({mnemonic, derivePath, type});
    const keyringJson = keyringPair.toJson();
    const correlationDocs: WalletDocument[] = [];

    correlationDocs.push({
      '@context': ['https://w3id.org/wallet/v1'],
      id: uuid(),
      type: 'KeyringPair',
      value: keyringJson,
    });

    correlationDocs.push({
      '@context': ['https://w3id.org/wallet/v1'],
      id: uuid(),
      type: 'Currency',
      value: 0,
      symbol: 'DOCK',
    });

    if (mnemonic) {
      correlationDocs.push({
        '@context': ['https://w3id.org/wallet/v1'],
        id: uuid(),
        type: 'Mnemonic',
        value: mnemonic,
      });
    }

    const addressDocument: WalletDocument = {
      '@context': ['https://w3id.org/wallet/v1'],
      id: keyringPair.address,
      type: 'Address',
      value: keyringPair.address,
      address: keyringPair.address,
      name,
      correlation: correlationDocs.map(doc => doc.id),
    };

    await this.wallet.add(addressDocument);
    await Promise.all(correlationDocs.map(doc => this.wallet.add(doc)));

    return [addressDocument, ...correlationDocs];
  }
  async resolveCorrelations(documentId) {
    const document = await this.getDocumentById(documentId);

    assert(!!document, `Document ${documentId} not found`);

    const correlation = await Promise.all(
      (document.correlation || []).map(docId => this.getDocumentById(docId)),
    );

    const result = [document, ...correlation];

    return result;
  }

  _assertWallet() {
    assert(!!this.wallet, `wallet is not created`);
  }

  async getAccountKeypair(accountId) {
    const correlations = await this.resolveCorrelations(accountId);
    const keyPairDocument = correlations.find(
      doc => doc.type === 'KeyringPair',
    );

    assert(
      !!keyPairDocument,
      `Keypair document not found for account: ${accountId}`,
    );

    const pair = keyringService.addFromJson({
      jsonData: keyPairDocument.value,
      password: '',
    });

    pair.unlock();

    return pair;
  }

  getDocumentById(id: string) {
    this._assertWallet();
    validation.getDocumentById(id);

    return this.wallet.getStorageDocument({id}).then(doc => doc.content);
  }
}

export const walletService: WalletService = new WalletService();
