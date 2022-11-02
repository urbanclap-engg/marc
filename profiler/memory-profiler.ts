import {uploadDataToS3} from './utils'
import fs from 'fs';
import { ProfileType } from './interface';

async function takeSnapshot(fileName) {
  const heapdump = require('heapdump');
  const filePath = './' + fileName;
  const res = heapdump.writeSnapshot(filePath);
  if (res) {
    const fileStream = fs.createReadStream(filePath);
    const s3Path = `${ProfileType.MEMORY}/${fileName}`;
    uploadDataToS3(fileStream, s3Path);
  }
}

export default { takeSnapshot };