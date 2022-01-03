import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import './App.css';
import MessengerContract from './abi/Messenger.json';

function App() {
  const [accounts, setAccounts] = useState([0]);
  const [author, setAuthor] = useState('');
  const [message, setMessage] = useState('');
  const [messengerContract, setMessengerContract] = useState();
  const [userFee, setUserFee] = useState(0);
  const [minFee, setMinFee] = useState(0);
  const [messages, setMessages] = useState([]);
  const [alertStatus, setAlertStatus] = useState({
    isVisible: false,
    className: '',
    message: ''
  });

  async function connect() {
    if (!window.ethereum) displayErrorMessage('This app requires metamask');
    const requestedAccounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    setAccounts(requestedAccounts);

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const newMessengerContract = new ethers.Contract(
      process.env.REACT_APP_MESSENGER_CONTRACT_ADDRESS,
      MessengerContract.abi,
      signer
    );

    const initialFeeWei = (await newMessengerContract.fee()).toNumber()
    const initialFeeGWei = ethers.utils.formatUnits(initialFeeWei, "gwei");

    setMinFee(initialFeeGWei);
    setUserFee(initialFeeGWei);

    setMessages(await newMessengerContract.getAllMessages());

    setMessengerContract(newMessengerContract);
  }

  async function sendMessage(author, message) {
    try {
      const fee = ethers.utils.parseUnits(userFee, "gwei");
      const overrides = {
        value: fee
      }
      const response = await messengerContract.sendMessage(author, message, overrides);
      console.log(response);
      displaySuccessMessage('Message Sent');
      clearMessage();
      setMessages(await messengerContract.getAllMessages());
    } catch (err) {
      console.log(err);
      displayErrorMessage(err.data.message);
    }
  }

  function displaySuccessMessage(message) {
    setAlertStatus({
      isVisible: true,
      className: 'success',
      message
    });
  }

  function displayErrorMessage(message) {
    setAlertStatus({
      isVisible: true,
      className: 'error',
      message
    });
  }

  function handleSubmit(e) {
    if (author === '' || message === '') return;
    e.preventDefault();
    sendMessage(author, message);
  }

  function clearMessage() {
    setAuthor('');
    setMessage('');
  }

  function ShowAlert() {
    return (
      <label>
        <input type="checkbox" className="alertCheckbox" autoComplete="off" />
        <div className={`alert ${alertStatus.className}`}>
          <span className="alertClose">X</span>
          <span className="alertText">{alertStatus.message}</span>
        </div>
      </label>
    );
  }


  useEffect(() => {
    connect();
  }, []);

  return (
    <div>
      <form>
        <div id="form-main-container">
          { alertStatus.isVisible && <ShowAlert/>}
          <div id="form-area">
            <div id="form-title">Message through blockchain
            <br/>
            <span style={{fontSize: "0.8rem"}}>Connected Account: {(accounts[0])}</span></div>
            <div id="form-body">
              <div>
                <div className="col-12">
                  <fieldset className="form-group">
                    <label className="form-label" htmlFor="author">
                      Author
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="author"
                      placeholder="Your name..."
                      required
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                    />
                  </fieldset>
                </div>
                <div className="col-12">
                  <fieldset className="form-group">
                    <label className="form-label" htmlFor="message">
                      Message
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="message"
                      placeholder="Your message..."
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </fieldset>
                </div>
                <div className="col-12">
                  <fieldset className="form-group">
                    <label className="form-label" htmlFor="message">
                      Donation
                      <br/>
                      (eth): {userFee / 1000000000}
                      <br/>
                      (gwei): {userFee}
                    </label>
                    <input type="range" min={minFee} max="1000000000" className="slider" step="2" value={userFee} onChange={(e) => setUserFee(e.target.value)}/>
                  </fieldset>
                </div>
              </div>
              <div>
                <div className="center-text button-area">
                  <button type="submit" className="btn btn-cancel" onClick={handleSubmit}>
                    Send Message
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      <h2 className="text-header">Messages</h2>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Address</th>
              <th>Author</th>
              <th>Message</th>
              <th>Donation (eth)</th>
            </tr>
          </thead>
          <tbody>
          { messages.map((message, index) => (
            <tr key={index + message[0]}>
              <td>{message[0]}</td>
              <td>{message[1]}</td>
              <td>{message[2]}</td>
              <td>{ethers.utils.formatEther(message[3].toString(), "gwei")}</td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
