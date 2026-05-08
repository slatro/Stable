import { ethers } from "ethers";
import * as fs from "fs";

const abiJson = JSON.parse(fs.readFileSync("./frontend/src/abis/ArcMultiFaucet.json", "utf8"));
const iface = new ethers.Interface(abiJson.abi);

console.log("--- METHOD SIGNATURES IN ArcMultiFaucet.json ---");
iface.forEachFunction((func) => {
  console.log(`${func.name}${func.inputs.map(i => i.type)}: ${func.selector}`);
});
