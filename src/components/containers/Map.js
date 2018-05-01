import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { firebaseConnect } from 'react-redux-firebase';
import { bindActionCreators } from 'redux';
import { compose, withProps, withHandlers, lifecycle } from 'recompose';
import { withRouter } from 'react-router-dom';
import { withScriptjs, withGoogleMap, GoogleMap, Marker, DirectionsRenderer } from 'react-google-maps';
import MarkerClusterer from 'react-google-maps/lib/components/addons/MarkerClusterer';

import { fetchMarkers, initPosition, eatBeans, setTimer, timeOut, calSpeed, gameDialog, gameEnd } from '../../actions';
import { MapDialog, GameStartDialog, GamePauseDialog, GameEndDialog } from '../common';
import Distance from '../../Distance';

/* global google */
const MapWithAMarkerClusterer = compose(
  withProps({
    googleMapURL: 'https://maps.googleapis.com/maps/api/js?key=AIzaSyC6u4b84tBPokRRlbVhzXorKh93BzP9OPA',
    loadingElement: <div style={{ height: '100%' }} />,
    containerElement: <div style={{ height: '100vh' }} />,
    mapElement: <div style={{ height: '100%' }} />,
  }),
  withHandlers({
    onMarkerClustererClick: () => (markerClusterer) => {
      const clickedMarkers = markerClusterer.getMarkers();
      console.log(`Current clicked markers length: ${clickedMarkers.length}`);
      console.log(clickedMarkers);
    },
  }),
  withScriptjs,
  withGoogleMap,
  lifecycle({
    componentDidMount() {
      const DirectionsService = new google.maps.DirectionsService();

      DirectionsService.route({
        origin: new google.maps.LatLng(25.032854, 121.435198),
        destination: new google.maps.LatLng(25.038491, 121.431402),
        travelMode: google.maps.TravelMode.WALKING,
        provideRouteAlternatives: true,
      }, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          this.setState({
            directions: result,
          });
          // duration 的值 還不知道怎麼傳到 parent
          // console.log(result.routes[1].legs[0].duration.value);
          // console.log(result);
        } else {
          console.error(`error fetching directions ${result}`);
        }
      });
    },
  }),
)(props =>
  (
    <GoogleMap
      defaultZoom={17}
      defaultCenter={{ lat: 25.03515125, lng: 121.4330576875 }}
    >
      {
        props.showDirections && props.directions &&
        <DirectionsRenderer directions={props.directions} routeIndex={1} />
      }
      <MarkerClusterer
        onClick={props.onMarkerClustererClick}
        averageCenter
        enableRetinaIcons
        gridSize={60}
      >
        {props.markers.map(marker => (
          <Marker
            key={marker.id}
            onClick={() => { console.log(`${marker.latitude}, ${marker.longitude}`); }}
            position={{ lat: marker.latitude, lng: marker.longitude }}
          />
          ))}
      </MarkerClusterer>
    </GoogleMap>));


class Map extends Component {
  constructor(props) {
    super(props);
    this.state = {
      gameKey: null,
      expectTimeCost: 805,
      expectDistance: 10,
      destination: {
        lat: 25.038491,
        lng: 121.431402,
      },
      totalBeans: 377,
      w1: 0.5,
      w2: 0.3,
      sd: 10, // Default exercise speed <- 看不懂的東西
    };// 暫時 hard code
  }
  componentWillMount() {
    this.props.fetchMarkers();
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        this.props.initPosition(lat, lon);
      },
      ((error) => { console.log(error.message); }),
      {
        enableHighAccuracy: true, timeout: 20000, maximumAge: 1000, distanceFilter: 10,
      },
    );
  }

  componentDidMount() {
    this.GetLocationAndEatBean();
    this.SetAlarm(5); // input is minutes
    console.log(this.props.location.state);
    window.addEventListener('focus', () => {
      console.log('window has focus');
      if (!(this.props.beanMap.gameStartDialog)) {
        this.props.gameDialog('pause', true);
      }
    }, false);
    window.addEventListener('blur', () => {
      console.log('window lost focus');
    }, false);
  }

  componentWillUnmount() {
    navigator.geolocation.clearWatch(this.watchId);
  }

  HandleTouch(e) {
    console.log(this.state);
    console.log(e.targetTouches[0].clientX);
    console.log(e.targetTouches[0].clientY);
  }

  SetAlarm(minutes) {
    this.props.setTimer(minutes);
    setTimeout(() => {
      this.props.timeOut(new Date().getTime());
    }, 1000 * 60 * minutes);
  }

  GetLocationAndEatBean() {
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const {
          destination, totalBeans, expectTimeCost,
          expectDistance, w1, w2, sd,
        } = this.state;
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        this.SetAlarm(5); // Reset time clock
        this.props.eatBeans(lat, lng);
        this.props.calSpeed(lat, lng, new Date().getTime());
        let dist = Distance(lat, lng, destination.lat, destination.lng, 'K');
        dist = Math.round(dist * 1000) / 1000; // 四捨五入
        dist *= 1000; // 1 Km = 1000m
        console.log(dist);
        if (dist < 5) {
          console.log('game end');
          this.props.gameEnd(
            totalBeans, expectTimeCost, expectDistance,
            w1, w2, sd, new Date().getTime(),
          );
        }
        console.log('location changed!');
      },
      ((error) => { console.log(error.message); }),
      {
        enableHighAccuracy: true, timeout: 20000, maximumAge: 1000, distanceFilter: 10,
      },
    );
  }

  render() {
    const { mode } = this.props.location.state;
    return (
      <div
        onTouchStart={(e) => {
          // console.log(e.targetTouches[0].pageX);
          this.HandleTouch(e);
        }}
        role="presentation"
      >
        <h1 style={{ position: 'absolute', left: '50%', zIndex: '10' }}>{this.props.beanMap.score}</h1>
        <MapWithAMarkerClusterer
          id="map"
          markers={this.props.beanMap.markers}
          showDirections={mode === '半自動'}
        />
        <MapDialog
          id="start"
          title="遊戲開始"
          buttonText="ok"
          open={this.props.beanMap.gameStartDialog}
          onClose={() => {
            this.props.gameDialog('start', false);
            // console.log(this.props.firebaseAuth.uid);
            // console.log(this.state);
            const UID = this.props.firebaseAuth.uid;
            this.props.firebase.push(
              'game',
              {
                userUid: UID,
                mode,
                interface: 'Material',
              },
            ).then(async (result) => {
              // console.log(result.key);
              await this.setState({ gameKey: result.key });
            });
          }}
        >
          <GameStartDialog mode={mode} />
        </MapDialog>
        <MapDialog
          id="pause"
          title="遊戲暫停"
          buttonText="continue"
          open={this.props.beanMap.gamePauseDialog}
          onClose={() => {
            this.props.gameDialog('pause', false);
          }}
        >
          <GamePauseDialog pill={5} ghost={1} speed={5} />
        </MapDialog>
        <MapDialog
          id="end"
          title="遊戲結束"
          buttonText="ok"
          open={this.props.beanMap.gameEndDialog}
          onClose={() => {
            const {
              score, ghostCounter, distance, totalTime, maxSpeed,
              gameScore, sportScore,
            } = this.props.beanMap;

            const { totalBeans, expectTimeCost } = this.state;
            // console.log(this.state.gameKey);
            this.props.firebase.update(
              `game/${this.state.gameKey}`,
              {
                beanEaten: score,
                caughtTimes: ghostCounter,
                totalDistance: distance,
                timeSpent: totalTime,
                heartRate: 1, // hard code
                maxSpeed,
                gameScore,
                sportScore,
                totalBeans,
                expectTimeCost,
              },
            );
            this.props.gameDialog('end', false);
            this.props.history.push({
              pathname: '/GameSegment',
              state: {},
            });
          }}
        >
          <GameEndDialog
            pill={this.props.beanMap.score}
            exercise={this.props.beanMap.sportScore}
            game={this.props.beanMap.gameScore}
          />
        </MapDialog>
      </div>
    );
  }
}

Map.propTypes = {
  fetchMarkers: PropTypes.func.isRequired,
  initPosition: PropTypes.func.isRequired,
  eatBeans: PropTypes.func.isRequired,
  setTimer: PropTypes.func.isRequired,
  timeOut: PropTypes.func.isRequired,
  calSpeed: PropTypes.func.isRequired,
  gameDialog: PropTypes.func.isRequired,
  gameEnd: PropTypes.func.isRequired,
  beanMap: PropTypes.shape({
    score: PropTypes.number.isRequired,
    markers: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number.isRequired,
      latitude: PropTypes.number.isRequired,
      longitude: PropTypes.number.isRequired,
    })).isRequired,
    gameStartDialog: PropTypes.bool.isRequired,
    gamePauseDialog: PropTypes.bool.isRequired,
    gameEndDialog: PropTypes.bool.isRequired,
    ghostCounter: PropTypes.number.isRequired,
    distance: PropTypes.number.isRequired,
    totalTime: PropTypes.number.isRequired,
    maxSpeed: PropTypes.number.isRequired,
    gameScore: PropTypes.number.isRequired,
    sportScore: PropTypes.number.isRequired,
  }).isRequired,
  firebaseAuth: PropTypes.shape({
    uid: PropTypes.string.isRequired,
  }).isRequired,
  location: PropTypes.shape().isRequired,
  firebase: PropTypes.shape().isRequired,
  history: React.PropTypes.shape().isRequired,
};

function mapStateToProps(state) {
  // Whatever is returned will show up as props inside the Map
//   console.log(state);
  return {
    beanMap: state.beanMap,
    firebaseAuth: state.firebase.auth,
  };
}

// Anything return from this function will end up as props
// on the Map container
function mapDispatchToProps(dispatch) {
  // Whenever eatBeans is called, the results should be
  // pass to all our reducers
  return bindActionCreators({
    fetchMarkers,
    initPosition,
    eatBeans,
    setTimer,
    timeOut,
    calSpeed,
    gameDialog,
    gameEnd,
  }, dispatch);
}


// Promote Map from a component to a container - it needs to know
// about this dispatch method, eatBeans. Make it as a props
const map = compose(
  firebaseConnect(),
  connect(mapStateToProps, mapDispatchToProps),
)(Map);
export default withRouter(map);