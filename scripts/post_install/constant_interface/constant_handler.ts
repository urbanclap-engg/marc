/*******
 * Utility to convert swagger schemas to type declaration files
 */
import fs from 'fs';
import RPCConstants from '../../../constants';
const DIR = './schema/service_dependency_interface/';
const RPCId = RPCConstants.DEPENDENCY.ID;
import JsonToTS from 'json-to-ts';

/******
 * utility function to write data to files inside ${DIR}
 * @param filename
 * @param fileContent
 */
const writeToFile = (filename: string, fileContent: string) => {
    if (!fs.existsSync(DIR))
        fs.mkdirSync(DIR);
    fs.writeFile(`${DIR}${filename}`, fileContent, (error) => {
        if (error) throw error;
    });
};

const convertAndWriteDts = async (json: any, fname: string) => {
    let fContent = "export ";
    JsonToTS(json).forEach( typeInterface => {
        fContent += typeInterface + "\n";
    })
    await writeToFile(fname, fContent);
}

export const createRpcConstInterface = async () => {    
    convertAndWriteDts(RPCId, 'dependency_id.ts')
}