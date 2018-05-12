import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { firebaseConnect } from 'react-redux-firebase';
import { compose } from 'recompose';

import { ThreeButtonSelection } from '../common';

const Main = props => (
  <div>
    <ThreeButtonSelection
      header="Life Chasing"
      secondary
      first="開始遊戲"
      second="查詢記錄"
      third="登出"
      clickHandler={(a) => {
        console.log(a);
        switch (a) {
          case '開始遊戲':
            console.log('start game');
            console.log(props.firebaseAuth.uid);
            props.firebase.push(
              'game',
              {
                userUid: props.firebaseAuth.uid,
              },
            ).then(async (result) => {
              // console.log(result.key);
              props.history.push({
                pathname: '/SelectInterface',
                state: { gameKey: result.key },
              });
            });
            break;
          case '查詢記錄':
            console.log('check record');
            props.history.push({
              pathname: '/GameRecord',
              state: {},
            });
            break;
          case '登出':
            console.log('logout');
            props.firebase.logout();
            props.history.push({
              pathname: '/StartPage',
              state: {},
            });
            break;
          default:
            break;
        }
       }}
    />
  </div>
);

Main.propTypes = {
  firebase: PropTypes.shape().isRequired,
  history: React.PropTypes.shape().isRequired,
  firebaseAuth: PropTypes.shape({
    uid: PropTypes.string.isRequired,
  }).isRequired,
};

function mapStateToProps(state) {
  return {
    firebaseAuth: state.firebase.auth,
  };
}

const main = compose(
  firebaseConnect(),
  connect(mapStateToProps),
)(Main);

export default withRouter(main);
