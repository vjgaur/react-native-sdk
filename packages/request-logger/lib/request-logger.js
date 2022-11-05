import {getRealm} from '@docknetwork/wallet-sdk-core/lib/core/realm';
import assert from 'assert';
import {v4 as uuidv4} from 'uuid';
export const RequestLogger = (function () {
  const exportLog = () => {
    const realm = getRealm();
    return realm.objects('RequestLog').toJSON();
  };
  const logRequest = ({
    status,
    url,
    method,
    headers = {},
    body = {},
    response,
  }) => {
    assert(typeof url === 'string', 'invalid url');
    assert(typeof method === 'string', 'invalid method');
    const id = uuidv4();
    const realm = getRealm();

    const log = {
      id,
      url,
      method,
      status,
      headers: JSON.stringify(headers),
      body: JSON.stringify(body),
      response: JSON.stringify(response),
      createdAt: new Date().toISOString(),
    };

    realm.write(() => {
      realm.create('RequestLog', log);
    });
    return id;
  };
  return {
    exportLog,
    logRequest,
  };
})();
