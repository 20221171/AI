//import logo from './logo.svg';
import React from 'react';
//import Home from './Home'; // puppySense UI가 있는 컴포넌트
import './Home.css';
import './App.css';
import Feedback from './Feedback';
// function App() {
//   return <Home />;
// }
// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }
function App() {
  return <Feedback />;
}

export default App;
