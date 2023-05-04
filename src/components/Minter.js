import { useEffect, useState } from "react";
import Web3 from "web3";
import contract from "../contracts/contract.json";
import Apple from "../assets/apple.png";
const BN = require('bn.js');

const initialInfoState = {
  connected: false,
  status: null,
  account: null,
  web3: null,
  contract: null,
  address: null,
  contractJSON: null,
};

const initialMintState = {
  loading: false,
  status: `Mint Admeal NFT`,
  amount: 1,
  maxSupply: 0,
  totalSupply: 0,
  cost: "0",
};

function Minter() {
  const [info, setInfo] = useState(initialInfoState);
  const [mintInfo, setMintInfo] = useState(initialMintState);

  const init = async (_request, _contractJSON) => {
    if (window.ethereum.isMetaMask) {
      try {
        const accounts = await window.ethereum.request({
          method: _request,
        });
        const networkId = await window.ethereum.request({
          method: "net_version",
        });
        if (networkId == 5) {
          let web3 = new Web3(window.ethereum);
          setInfo((prevState) => ({
            ...prevState,
            connected: true,
            status: null,
            account: accounts[0],
            web3: web3,
            contract: new web3.eth.Contract(
              _contractJSON.abi,
              _contractJSON.networks['5'].address
            ),
            contractJSON: _contractJSON,
          }));
        } else {
          setInfo(() => ({
            ...initialInfoState,
            status: `Change network to goerli.`,
          }));
        }
      } catch (err) {
        console.log(err.message);
        setInfo(() => ({
          ...initialInfoState,
        }));
      }
    } else {
      setInfo(() => ({
        ...initialInfoState,
        status: "Please install metamask.",
      }));
    }
  };

  const initListeners = () => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", () => {
        window.location.reload();
      });
      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }
  };

  const getSupply = async () => {
    try {
      const maxSupply = await info.contract.methods.maxSupply().call();
      const totalSupply = await info.contract.methods.totalSupply().call();

      console.log((new BN(maxSupply).toString() * 1));

      setMintInfo((prevState) => ({
        ...prevState,
        maxSupply: (new BN(maxSupply).toString() * 1),
        totalSupply: (new BN(totalSupply).toString() * 1),
      }));
    } catch (err) {
      console.log(err);
    }
  };

  const getCost = async () => {


    try {
      let result = await info.contract.methods.tokenPrice().call();
      setMintInfo((prevState) => ({
        ...prevState,
        cost: result,
      }));
    } catch (err) {
      console.log(err);
    }
  };

  const mint = async () => {

    try {
      setMintInfo((prevState) => ({
        ...prevState,
        loading: true,
        status: `Minting ${mintInfo.amount}...`,
      }));
      console.log(typeof mintInfo.amount);
      await info.contract.methods.buyInETH(mintInfo.amount).send({ from: info.account, value: (new BN(mintInfo.cost).mul(new BN(mintInfo.amount))).toString() });
      setMintInfo((prevState) => ({
        ...prevState,
        loading: false,
        status:
          "Nice! Your NFT will show up on Opensea, once the transaction is successful.",
      }));
      getSupply();
    } catch (err) {
      setMintInfo((prevState) => ({
        ...prevState,
        loading: false,
        status: err.message,
      }));
    }
  };

  const updateAmount = (newAmount) => {
    if (newAmount >= 1) {
      setMintInfo((prevState) => ({
        ...prevState,
        amount: newAmount,
      }));
    }
  };

  const connectToContract = (_contractJSON) => {
    init("eth_requestAccounts", _contractJSON);
  };

  useEffect(() => {
    connectToContract(contract);
    initListeners();
  }, []);

  useEffect(() => {
    if (info.connected) {
      getSupply();
      getCost();
    }
  }, [info.connected]);

  return (
    <div className="page">
      <div className="card">
        <div className="card_header colorGradient">
          <img className="card_header_image ns" alt={"banner"} src={Apple} />
        </div>
        {mintInfo.totalSupply <= mintInfo.maxSupply ? (
          <div className="card_body">
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <button
                disabled={!info.connected || mintInfo.cost == "0"}
                className="small_button"
                onClick={() => updateAmount(mintInfo.amount - 1)}
              >
                -
              </button>
              <div style={{ width: 10 }}></div>
              <button
                disabled={!info.connected || mintInfo.cost == "0"}
                className="button"
                onClick={() => mint()}
              >
                Mint {mintInfo.amount}
              </button>
              <div style={{ width: 10 }}></div>
              <button
                disabled={!info.connected || mintInfo.cost == "0"}
                className="small_button"
                onClick={() => updateAmount(mintInfo.amount + 1)}
              >
                +
              </button>
            </div>
            {info.connected ? (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <p style={{ color: "var(--statusText)", textAlign: "center" }}>
                  {(info.web3?.utils.fromWei(mintInfo.cost, "ether") *
                    mintInfo.amount).toFixed(4)}{" "}
                  {"ETH"}
                </p>
                <div style={{ width: 20 }}></div>
                <p style={{ color: "var(--statusText)", textAlign: "center" }}>
                  |
                </p>
                <div style={{ width: 20 }}></div>
                <p style={{ color: "var(--statusText)", textAlign: "center" }}>
                  {mintInfo.totalSupply}/{mintInfo.maxSupply}
                </p>
              </div>
            ) : null}
            {mintInfo.status ? (
              <p className="statusText">{mintInfo.status}</p>
            ) : null}
            {info.status ? (
              <p className="statusText" style={{ color: "var(--error)" }}>
                {info.status}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="card_body">
            <p style={{ color: "var(--statusText)", textAlign: "center" }}>
              {mintInfo.totalSupply}/{mintInfo.maxSupply}
            </p>
            <p className="statusText">
              We've sold out! .You can still buy and trade the {contract.name}{" "}
              on marketplaces such as Opensea.
            </p>
          </div>
        )}
        <div className="card_footer colorGradient">
          <button
            className="button"
            style={{
              backgroundColor: info.connected
                ? "var(--success)"
                : "var(--warning)",
            }}
            onClick={() => connectToContract(contract)}
          >
            {info.account ? "Connected" : "Connect Wallet"}
          </button>
          {info.connected ? (
            <span className="accountText">
              {String(info.account).substring(0, 6) +
                "..." +
                String(info.account).substring(38)}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default Minter;
