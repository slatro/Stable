import { ethers } from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();
  const addresses = [
    "0x0B6f4699042bC7dC79172960613203417772c67E",
    "0x16460C7E5a720970720235948332A7813a0B3598",
    "0x2804257766D012B2625D6005737d22B5968593a8",
    "0x3f510825B3E6E8bE5D20343396860E87F3B96A8e",
    "0x403d16853e536136B2B380302E4E11F686a68f00",
    "0x7E1D8b0fA3A6915f013C9A862378D7e6fD6964F8",
    "0x8F07a3D916f1F9F663675e47895f366113b246a4",
    "0xC59300B293e5C0D30489953883aA082b260Eda28",
    "0xd90998f46046e7fBa34091B077c570f8076615b8",
    "0xACD6A3Ac96DF60f780fa617D180c84298D84E074",
    "0xc8bf5f8DA69e760B57A73617561D8D2BaaCd746c",
    "0x8F8814aD5Eef85C6235dcc123A3786A3597573A5",
    "0x202CCe504e04bEd6fC0521238dDf04Bc9E8E15aB"
  ];

  const ABI = ["function balanceOf(address account) view returns (uint256)", "function symbol() view returns (string)"];

  for (const addr of addresses) {
    try {
      const contract = new ethers.Contract(addr, ABI, signer);
      const balance = await contract.balanceOf(signer.address);
      let symbol = "UNKNOWN";
      try { symbol = await contract.symbol(); } catch (e) {}
      console.log(`ADDR: ${addr} | SYMBOL: ${symbol} | BAL: ${balance}`);
    } catch (e) {
      console.log(`ADDR: ${addr} | FAILED`);
    }
  }
}

main().catch(console.error);
