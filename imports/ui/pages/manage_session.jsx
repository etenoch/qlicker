/* global confirm  */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// manage_course.jsx: page for managing a specific course

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'

import draftToHtml from 'draftjs-to-html'

import { Sessions } from '../../api/sessions'
import { Questions } from '../../api/questions'

import { AddQuestionModal } from '../modals/AddQuestionModal'
import { QuestionListItem } from '../QuestionListItem'

class _ManageSession extends Component {

  constructor (props) {
    super(props)

    this.state = { editing: false, session: _.extend({}, this.props.session) }
    this.sessionId = this.props.sessionId

    this.handleSubmit = this.handleSubmit.bind(this)
    this.setValue = this.setValue.bind(this)
    this.removeQuestion = this.removeQuestion.bind(this)
  }

  setValue (e) {
    let stateEdits = this.state
    let key = e.target.dataset.name
    if (key === 'quiz') stateEdits.session[e.target.dataset.name] === (e.target.value === 'true')
    else stateEdits.session[e.target.dataset.name] = e.target.value
    this.setState(stateEdits)
  }

  handleSubmit (e) {
    e.preventDefault()

    Meteor.call('sessions.edit', this.state.session, (error) => {
      if (error) alertify.error('Error: ' + error.error)
      else {
        alertify.success('Question Added')
        this.setState({ editing: false })
      }
    })
  }

  removeQuestion (questionId) {
    Meteor.call('sessions.removeQuestion', this.sessionId, questionId, (error) => {
      if (error) alertify.error('Error: ' + error.error)
      else alertify.success('Question Removed')
    })
  }

  render () {
    const startEditing = () => {
      this.setState({ editing: true })
    }
    const toggleAddingQuestion = () => {
      this.setState({ addingQuestion: !this.state.addingQuestion })
    }

    const quizDate = this.state.quiz ? 'Deadline: ' + this.props.session.dueDate : ''
    const quizEdit = this.state.quiz ? 'Deadline: Date picker here' : ''
    return (
      <div className='container ql-manage-session'>
        <h2>Session: { this.state.session.name } </h2>
        { !this.state.editing ? <button className='btn btn-default' ref='editButton' onClick={startEditing}>Edit Session</button> : '' }
        <form ref='editSessionForm' className='ql-form-editsession' onSubmit={this.handleSubmit}>
          Name: { this.state.editing ?
            <input type='text' className='form-control' data-name='name' onChange={this.setValue} value={this.state.session.name} /> :
            this.state.session.name }<br />

          Description: { this.state.editing ?
            <textarea className='form-control' data-name='description'
              onChange={this.setValue}
              placeholder='Quiz on topic 3'
              value={this.state.session.description} /> :
            this.state.session.description }<br />

          Format: { this.state.editing ?
            <select className='form-control' data-name='quiz' onChange={this.setValue} defaultValue={this.state.session.quiz}>
              <option value={false}>Lecture Poll</option>
              <option value>Online Quiz</option>
            </select> :
            this.state.session.quiz ? 'Quiz' : 'Lecture Poll' }<br />

          Status: { this.state.editing ?
            <select className='form-control' data-name='status' onChange={this.setValue} defaultValue={this.state.session.status}>
              <option value='hidden'>Draft (Hidden)</option>
              <option value='visible'>Visible</option>
              <option value='running'>Active</option>
              <option value='done'>Done</option>
            </select> :
            this.state.session.status }<br />

          { this.state.editing ? quizDate : quizDate }
          { this.state.editing ? <input className='btn btn-default' type='submit' /> : '' }
        </form>

        <h3>Questions</h3>
        <button className='btn btn-default' ref='addQuestionButton' onClick={toggleAddingQuestion}>Add Question</button>

        {
          this.props.questions.map((q) => {
            return <QuestionListItem key={q._id} question={q} remove={this.removeQuestion} />
          })
        }

        { this.state.addingQuestion ?
          <AddQuestionModal
            session={this.props.session}
            questions={this.props.questionPool}
            done={toggleAddingQuestion} />
          : '' }

      </div>)
  }

}

export const ManageSession = createContainer((props) => {
  const handle = Meteor.subscribe('sessions')
    && Meteor.subscribe('questions.inSession', props.sessionId)
    && Meteor.subscribe('questions.library')
  const session = Sessions.find({ _id: props.sessionId }).fetch()[0]

  return {
    questions: Questions.find({ _id: { $in: session.questions || [] } }).fetch(),
    questionPool: Questions.find({ }).fetch(),
    session: session,
    loading: !handle.ready()
  }
}, _ManageSession)

