import React, { Component } from 'react'
import PropTypes from 'prop-types';



export class JitsiWindow extends Component {
  constructor (props) {
    super(props)

    this.state = {
        api:null,
        domain: null
      }

  }

/*
  componentWillMount() {
    Meteor.call('settings.getJitsiDomain',  (err,result) => {
      if(!err){
        console.log(result)
        this.setState({domain:result})
      }
    })
  }*/


  componentDidMount() {
    if (!this.props.connectionInfo) {
      alertify.error('Error: no connection info  on mount')
    }

    Meteor.call('settings.getJitsiDomain',  (err,result) => {
      //This seemed like the best way to run the server side method to get the domain name from the settings.
      if(!err){ //only once the domain is known, can the API be initialized...
        const domain = result.domain
        const apiOptions = this.props.connectionInfo.apiOptions
        let options = this.props.connectionInfo.options

        //has to be set here, only exists once mounted
        options.parentNode = document.getElementById('ql-jitsi-inner')

        const api = new JitsiMeetExternalAPI(domain, options)
        this.setState({api:api})

        const closeWindow = () => {
          this.state.api.dispose()
          window.close()
        }

        if (api){
          //Close the window on hangup
          api.addListener('videoConferenceLeft', closeWindow)

          if(apiOptions.subjectTitle){
            api.executeCommand('subject', apiOptions.subjectTitle);
          }
          //Use Qlicker avatar:
          //api.executeCommand('avatarUrl', Meteor.User().getThumbnailUrl())
          //Mute audio on join
          if (apiOptions.startAudioMuted){
            api.isAudioMuted().then(muted => {
              if(!muted) api.executeCommand('toggleAudio');
            });
          }
          if (apiOptions.startVideoMuted){
            //redundant with the option set in configOverwrite:
            api.isVideoMuted().then(muted => {
              if(!muted) api.executeCommand('toggleVideo');
            });
          }

          //tile view toggle is set as a cookie, so need to check each time, for both true and false...
          //https://github.com/jitsi/jitsi-meet/issues/5764 - should eventually be able to do with settings
          if (apiOptions.startTileView){
            api.addListener('videoConferenceJoined', () => {
              const listener = ({ enabled }) => {
                if (!enabled) {
                  api.executeCommand('toggleTileView');
                }
                api.removeListener('tileViewChanged', listener); //remove so this only gets called once!
              };
              api.addEventListener('tileViewChanged', listener);
              api.executeCommand('toggleTileView'); //triggers the listener, which will toggle back to tileView if appropriate!
            });
          }
          if (apiOptions.startTileView == false){ //set
            api.addListener('videoConferenceJoined', () => {
              const listener = ({ enabled }) => {
                if (enabled) {
                  api.executeCommand('toggleTileView');
                }
                api.removeListener('tileViewChanged', listener); //remove so this only gets called once!
              };
              api.addEventListener('tileViewChanged', listener);
              api.executeCommand('toggleTileView'); //triggers the listener, which will toggle back to tileView if appropriate!
            });
          }
        }//end if api
      }//end if not err in Meteor method
    })//end Meteor method call
  }

  render () {

    if (!this.props.connectionInfo) return <div className='ql-subs-loading'>No connection info</div>
    return(
      <div className='ql-jitsi-outer' style={{width:'100%', 'height':'100vh'}}>
        <div id='ql-jitsi-inner' style={{width:'100%', 'height':'100%'}} />
      </div>
    )
  }

}


JitsiWindow.propTypes = {
  connectionInfo: PropTypes.object.isRequired,
  setApi: PropTypes.func
}
