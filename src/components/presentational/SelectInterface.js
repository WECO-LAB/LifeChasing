import React from 'react';
import { withRouter } from 'react-router-dom';
import { I18n } from 'react-i18next';

import { ThreeButtonSelection } from '../common/';
import DialogSelection from './DialogSelection';

class SelectInterface extends React.Component {
  constructor(props) {
    super(props);
    this.state = { open: false };
  }
  render() {
    return (
      <I18n>
        {
          t => (
            <div>
              <ThreeButtonSelection
                header={t('interface.title')}
                secondary={false}
                first={t('interface.material')}
                second={t('interface.elder_friendly')}
                third={t('interface.random')}
                clickHandler={(select) => {
                  switch (select) {
                    case t('interface.material'):
                      this.setState({ open: true });
                      break;
                    case t('interface.elder_friendly'):
                      this.props.history.push({
                        pathname: '/SelectStart',
                        state: {
                          gameKey: this.props.location.state.gameKey,
                          light: this.props.location.state.light,
                        },
                      });
                      break;
                    case t('interface.random'):
                      break;
                    default:
                      break;
                  }
                }}
              />
              <DialogSelection
                open={this.state.open}
                gameKey={this.props.location.state.gameKey}
                deny={() => {
                  this.setState({ open: false });
                }}
                light // Material 模式沒有動態介面，所以恆為亮
                /*
                  透過此 apply function props
                  把 child 的參數傳回 parent
                 */
                apply={(start, end, mode, fitbit, light) => {
                  console.log(fitbit);
                  this.setState({ open: false });
                  if (start === t('start.mrt') && end === t('end.hopital')) {
                    this.props.history.push({
                      pathname: '/MarkerCreator',
                      state: {
                        theInterface: t('interface.material'),
                        gameKey: this.props.location.state.gameKey,
                        start: { lat: 25.032854, lon: 121.435198 },
                        end: { lat: 25.038491, lon: 121.431402 },
                        mode,
                        light,
                        fitbit,
                      },
                    });
                  }
                }}
              />
            </div>
          )
        }
      </I18n>
    );
  }
}

SelectInterface.propTypes = {
  history: React.PropTypes.shape().isRequired,
  location: React.PropTypes.shape().isRequired,
};

export default withRouter(SelectInterface);
