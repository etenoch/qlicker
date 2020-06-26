// QLICKER
// Author: Enoch T <me@enocht.am>
//
// page_container.jsx: generic wrapper for logged in pages

import React, { Component } from 'react'
import PropTypes from 'prop-types';
import { withTracker }  from 'meteor/react-meteor-data'

import { PromoteAccountModal } from '../modals/PromoteAccountModal'
import { Courses } from '../../api/courses'

import { userGuideUrl } from '../../configs.js'
import $ from 'jquery'

class _CleanPageContainer extends Component {

  constructor (props) {
    super(props)
    this.state = {
      promotingAccount: false,
      courseId: this.props && this.props.courseId ? this.props.courseId : '',
      courseCode: '',
      ssoLogoutUrl: null,
      ssoInstitution: null,
      showCourse: (this.props && this.props.courseId)
    }
    alertify.logPosition('bottom right')

    this.changeCourse = this.changeCourse.bind(this)
    this.setCourseCode = this.setCourseCode.bind(this)

    if(this.state.courseId !== '') {
      this.setCourseCode(this.state.courseId)
    }

  }

  setCourseCode (courseId) {
    Meteor.call('courses.getCourseCodePretty', courseId, (e, c) => {
      if(c) {
        this.setState({ courseCode: c})
      }
    })
  }

  componentWillMount () {
    const token =  Meteor.user() ? Meteor._localStorage.getItem('Meteor.loginToken') : undefined
    if (token){
      Meteor.call("getSSOLogoutUrl", token, (err,result) => {
        if(!err){
          this.setState({ssoLogoutUrl:result})
          Meteor.call("settings.getSSOInstitution", (err2,name) => {
            if(!err2)this.setState({ssoInstitution:name})
          })
        }
      })
    }
  }

  componentDidMount () {
    // Close the dropdown when selecting a link during mobile
    // view.
    $('.navbar-collapse .dropdown-menu').click(function () {
      $('.navbar-collapse').collapse('hide')
    })
  }

  componentWillReceiveProps (nextProps) {
    this.setState({ courseId: nextProps.courseId ? nextProps.courseId : this.state.courseId, showCourse: nextProps.courseId ? true : false })
    if(nextProps.courseId) this.setCourseCode(nextProps.courseId)
  }

  changeCourse (courseId) {
    const pageName = Router.current().route.getName()
    //TODO: double check this, that all cases are caught!
    if (!(pageName.includes('session') || pageName === 'courses' ||
             pageName === 'professor'  || pageName === 'admin' || pageName === 'student'  ||
             pageName === 'profile' )){
      Router.go(pageName, { courseId: courseId })
    } else{
      Router.go('course', { courseId: courseId })
    }
  }

  render () {
    const user = Meteor.user()

    if(!user)  Router.go('logout')

    const canPromote = user.canPromote()
    const isAdmin = user.hasRole('admin')

    const logout = () => {
      Router.go('logout')
    }

    const togglePromotingAccount = () => { this.setState({ promotingAccount: !this.state.promotingAccount }) }

    const homePath = Router.routes[user.profile.roles[0]].path()
    const coursesPage = user.hasGreaterRole('professor')
      ? Router.routes['courses'].path()
      : Router.routes['student'].path()

    const click = () =>{console.log("click")}

    return (
      <div className='ql-page-body'>
        <div className='ql-page-nav'>

          <div className='ql-page-horiz-menu'>
            <div className='ql-logo' onClick={homePath} >Qlicker</div>
            <input type="checkbox" id="ql-page-horiz-menu" /><label htmlFor="ql-page-horiz-menu"></label>
            <ul>
              <li >
               <div className='ql-page-menu-item' onClick={click}>
                Item 1
               </div>
              </li>
              <li className='ql-page-menu-dropdown'>
                Item2 dropdown
                <div className='ql-page-menu-dropdown-content'>

                     <div className='ql-page-menu-item'  onClick={click}>
                      Sub item 1
                     </div>

                     <div className='ql-page-menu-item'  onClick={click}>
                      Sub item 2
                     </div>

                </div>
              </li>
              <li >
               <div className='ql-page-menu-item' onClick={click}>
                Item 3
               </div>
              </li>
              <li >
               <div className='ql-page-menu-item' onClick={click}>
                Item 4
               </div>
              </li>
              <li >
               <div className='ql-page-menu-item' onClick={click}>
                Item 5
               </div>
              </li>
              <li >
               <div className='ql-page-menu-item' onClick={click}>
                Item 6
               </div>
              </li>
              <li className='right'>
                <div className='ql-page-menu-item'  onClick={click}>
                 The profile
                </div>
              </li>
            </ul>
          </div>


        </div>

        <div className='ql-page-content'>
          { this.props.children }
          { canPromote && this.state.promotingAccount
            ? <PromoteAccountModal done={togglePromotingAccount} />
            : '' }
        </div>
      </div>
    )}
}

export const CleanPageContainer = withTracker(props => {
  const handle = Meteor.subscribe('courses')
  const courses = Courses.find({ inactive: { $in: [null, false] } }).fetch()

  return {
    courses: courses,
    //courseId: props.courseId,
    loading: !handle.ready()
  }
})( _CleanPageContainer)

CleanPageContainer.propTypes = {
  courseId:PropTypes.string
}
