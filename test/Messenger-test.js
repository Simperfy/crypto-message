/* eslint-disable no-undef */
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Messenger", () => {
  let messenger, owner;
  const initialFee = ethers.utils.parseUnits("10000.0", "gwei");
  const testAuthor = "Tester";
  const testMessage = "Test Message";

  before(async () => {
    [ owner ] = await ethers.getSigners();
    const Messenger = await ethers.getContractFactory("Messenger");
    messenger = await Messenger.deploy(initialFee);
    await messenger.deployed();
  });

  it("Should return the correct initial fee", async () => {
    const fee = await messenger.fee();

    expect(fee).to.equal(initialFee);
  });

  it("Should increment total messages after sending message with sufficient fee", async () => {
    const previousTotalMessages = await messenger.getTotalMessages();
    const value = ethers.utils.parseUnits("10000.0", "gwei");

    const sendMessageTx = await messenger.sendMessage(testAuthor, testMessage, {
      value
    });

    await sendMessageTx.wait();

    expect(await messenger.getTotalMessages()).to.gt(previousTotalMessages);

    const sentMessage = await messenger.messages(0);

    expect(sentMessage.sender).to.equal(owner.address);
    expect(sentMessage.author).to.equal(testAuthor);
    expect(sentMessage.message).to.equal(testMessage);
    expect(sentMessage.donation).to.equal(value);

    const sentMessage2 = (await messenger.getAllMessages())[0];

    expect(sentMessage.sender).to.equal(owner.address);
    expect(sentMessage2.author).to.equal(testAuthor);
    expect(sentMessage2.message).to.equal(testMessage);
    expect(sentMessage.donation).to.equal(value);
  });

  it("Should not accept empty strings", async () => {
    const sendMessageTxEmptyAuthor = messenger.sendMessage('', testMessage, {
      value: ethers.utils.parseUnits("10000.0", "gwei")
    });

    const sendMessageTxEmptyMessage = messenger.sendMessage(testAuthor, '', {
      value: ethers.utils.parseUnits("10000.0", "gwei")
    });

    const sendMessageTxEmptyAll = messenger.sendMessage('', '', {
      value: ethers.utils.parseUnits("10000.0", "gwei")
    });

    await expect(sendMessageTxEmptyAuthor).to.be.reverted;
    await expect(sendMessageTxEmptyMessage).to.be.reverted;
    await expect(sendMessageTxEmptyAll).to.be.reverted;
  });

  it("Should emit event after sending a message", async () => {
    const sendMessageTx = messenger.sendMessage(testAuthor, testMessage, {
      value: ethers.utils.parseUnits("10000.0", "gwei")
    });

    await expect(sendMessageTx).to.emit(messenger, 'MessageSent').withArgs(owner.address, testAuthor, testMessage);
  });

  it("Should revert after sending message with insufficient fee", async () => {
    const sendMessageTx = messenger.sendMessage(testAuthor, testMessage, {
      value: ethers.utils.parseUnits("9000.0", "gwei")
    });

    await expect(sendMessageTx).to.be.reverted;
  });

  it("Should revert after sending message with no fee", async () => {
    const sendMessageTx = messenger.sendMessage(testAuthor, testMessage);

    await expect(sendMessageTx).to.be.reverted;
  });

  it("Should revert after sending message with uneven fee", async () => {
    const sendMessageTx = messenger.sendMessage(testAuthor, testMessage, {
      value: ethers.utils.parseUnits("10000.000000033", "gwei")
    });

    await expect(sendMessageTx).to.be.reverted;
  });

  it("Should transfer balance to owner after withdraw", async () => {
    const currentBalance = await messenger.provider.getBalance(messenger.address);

    expect(currentBalance).to.gt(0);

    const sendMessageTx = await messenger.withdraw();

    await expect(sendMessageTx).to.changeEtherBalance(owner, currentBalance);
    expect(await messenger.provider.getBalance(messenger.address)).to.equal(0);
  });
});
