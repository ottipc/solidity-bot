const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("OneinchSlippageBot", function () {
    let OneinchSlippageBot;
    let bot;
    let owner;

    before(async function () {
        [owner] = await ethers.getSigners();
        OneinchSlippageBot = await ethers.getContractFactory("OneinchSlippageBot");
        bot = await OneinchSlippageBot.deploy("TOKEN", "TokenName");
        await bot.waitForDeployment();
    });

    it("should have correct token name and symbol", async function () {
        expect(await bot.tokenName()).to.equal("TokenName");
        expect(await bot.tokenSymbol()).to.equal("TOKEN");
    });
});
