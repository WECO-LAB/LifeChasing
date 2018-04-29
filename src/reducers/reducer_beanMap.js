import {
  FETCH_MARKERS,
  INIT_POSITION,
  EAT_BEANS,
  SET_TIMER,
  TIME_OUT,
  CAL_SPEED,
} from '../actions/type';
import Distance from '../Distance';

const initialState = {
  score: 0,
  alarm: new Date().getTime(),
  markers: [],
  ghost: false,
  ghostCounter: 0,
  maxSpeed: 0,
  avgSpeed: 0,
  distance: 0, // Km
  latitude: 0,
  longitude: 0,
  startTime: new Date().getTime(),
  lastUpdateTime: new Date().getTime(),
};

// State argument is not application state, only the state
// this reducer is responsible for

const beanMap = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_MARKERS:
      return Object.assign({}, state, {
        markers: action.payload.data.Dots,
      });
    case INIT_POSITION:
      return Object.assign({}, state, {
        latitude: action.latitude,
        longitude: action.longitude,
      });
    case EAT_BEANS: {
      let Counter = 0;
      return Object.assign({}, state, {
        markers: state.markers.filter((bean) => {
          // Eat Beans
          let dist = Distance(bean.latitude, bean.longitude, action.latitude, action.longitude, 'K');
          dist = Math.round(dist * 1000) / 1000; // 四捨五入
          dist *= 1000; // 1 Km = 1000m
          if (dist >= 5) {
            return bean;
          }
          Counter += 1;
          return false;
        }),
        score: (state.score + Counter),
      });
    }
    case SET_TIMER: {
      const now = new Date().getTime();
      /*
        getTime return the number of milliseconds since midnight January 1, 1970
        1 minute equal to 60 * 1000 milliseconds
      */
      return Object.assign({}, state, {
        alarm: (now + (1000 * 60 * action.payload)),
      });
    }
    case TIME_OUT: {
      /*
          action.payload is set after SET_TIMER
          so action.payload might be larger
          if the state.alarm, it means the alarm
          time must have been update
        */
      if (action.payload >= state.alarm) {
        return Object.assign({}, state, {
          ghost: true,
          ghostCounter: state.ghostCounter + 1,
        });
      }
      return state;
    }
    case CAL_SPEED: {
      /*
       There's a bug that accurs sometimes when it the same loaction, the distance isn't zero.
       It will return 0.00009493073054631141.
       according to this site https://www.movable-type.co.uk/scripts/latlong.html?
       rounding to 4 significant figures reflects the approx. 0.3% accuracy of the spherical model
       */
      let dist = Distance(state.latitude, state.longitude, action.latitude, action.longitude, 'K');
      dist = Math.round(dist * 1000) / 1000;
      const time = (action.currentTime - state.lastUpdateTime) * 1000 * 60 * 60;
      const totalTime = (action.currentTime - state.startTime) * 1000 * 60 * 60;
      const speed = dist / time;
      return Object.assign({}, state, {
        maxSpeed: Math.max(state.maxSpeed, speed),
        avgSpeed: (state.distance + dist) / totalTime,
        distance: (state.distance + dist),
        latitude: action.latitude,
        longitude: action.longitude,
        lastUpdateTime: action.currentTime,
      });
    }
    default:
      return state;
  }
};

export default beanMap;
