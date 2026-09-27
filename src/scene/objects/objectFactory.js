import {createComputeCore} from './computeCore';
import {createDatabaseReactor} from './databaseReactor';
import {createCloudMesh} from './cloudMesh';
import {createDataVault} from './dataVault';
import {createServerlessCore} from './serverlessCore';
import {createNeuralStructure} from './neuralStructure';
import {createCodePanel} from './codePanel';
const factories={compute:createComputeCore,database:createDatabaseReactor,cloud:createCloudMesh,vault:createDataVault,serverless:createServerlessCore,neural:createNeuralStructure,code:createCodePanel};
export function createTechObject(type,materials,{createNetwork}={}) {
  if(type==='network'&&createNetwork)return createNetwork();
  const create=factories[type];if(!create)throw new Error(`Unknown tech object type: ${type}`);
  return create(materials);
}
