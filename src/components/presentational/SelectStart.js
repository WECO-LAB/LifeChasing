import React from 'react';
import { withRouter } from 'react-router-dom';
import { I18n } from 'react-i18next';

import { ThreeButtonSelection } from '../common/';
import { HeatMapRecord } from '../containers';

const SelectStart = props => (
  <I18n>
    {
      t => (
        <HeatMapRecord page="SelectStart" gameKey={props.location.state.gameKey}>
          <ThreeButtonSelection
            header={t('start.title')}
            secondary
            first={t('start.mrt')}
            second={t('start.sf')}
            third={t('start.lane')}
            clickHandler={(a) => {
              console.log(a);
              props.history.push({
                pathname: '/SelectEnd',
                state: {
                  gameKey: props.location.state.gameKey,
                  start: a,
                },
              });
            }}
          />
        </HeatMapRecord>
      )
    }
  </I18n>
);

SelectStart.propTypes = {
  history: React.PropTypes.shape().isRequired,
  location: React.PropTypes.shape().isRequired,
};

export default withRouter(SelectStart);
