import React, { Component } from 'react';
import { render } from 'react-dom';

import { initializeApp, database } from 'firebase';

const config = {
  apiKey: 'AIzaSyBeEIpgau1srM0NtpnfAUVeWZhN0_UjZzo',
  authDomain: 'newscuria.firebaseapp.com',
  databaseURL: 'https://newscuria.firebaseio.com',
  storageBucket: 'project-1509371202819687696.appspot.com',
};// config

initializeApp(config);

require('bootstrap/dist/css/bootstrap.css');

class Example extends Component {
  constructor(props) {
    super(props);
    this.state = {
      items: [],
    };// state
  }// constructor

  componentWillMount() {
    this.firebaseRef = database().ref('top_images');
    console.log(this.firebaseRef);
    this.firebaseRef.limitToLast(25).on('value', (dataSnapshot) => {
    // this.firebaseRef.on('value', (dataSnapshot) => {
      const firebaseItems = dataSnapshot.val();
      this.setState({
        items: firebaseItems,
      });
    });
  }// componentWillMount

  componentWillUnmount() {
    this.firebaseRef.off();
  }// componentWillUnmount

  render() {
    return <h1>Hello World!</h1>;
  }// render
}// Example

render(<Example />, document.getElementById('react-app'));
