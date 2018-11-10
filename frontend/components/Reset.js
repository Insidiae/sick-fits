import React, { Component } from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import Router from 'next/router';
import PropTypes from 'prop-types';
import Form from './styles/Form';
import Error from './ErrorMessage';
import { CURRENT_USER_QUERY } from './User';

const RESET_MUTATION = gql`
  mutation RESET_MUTATION ($resetToken: String!, $password: String!, $confirmPassword: String!) {
    resetPassword(resetToken: $resetToken, password: $password, confirmPassword: $confirmPassword) {
      id
      email
      name
    }
  }
`;

class Reset extends Component {
  state = {
    password: '',
    confirmPassword: '',
  }

  static propTypes = {
    resetToken: PropTypes.string.isRequired,
  }

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  }

  render() {
    const { password, confirmPassword } = this.state;
    return (
      <Mutation
        mutation={RESET_MUTATION}
        variables={{
          resetToken:this.props.resetToken,
          password,
          confirmPassword
        }}
        refetchQueries={[{query: CURRENT_USER_QUERY}]}
      >
        {(reset, { error, loading }) => (
            <Form
              method="POST"
              onSubmit={async (e) => {
                e.preventDefault();
                await reset();
                this.setState({ password: '', confirmPassword: '' });
                Router.push({
                  pathname: '/items',
                });
              }}
            >
              <fieldset disabled={loading} aria-busy={loading}>
                <h2>Reset Your Password</h2>
                <Error error={error} />
                <label htmlFor="password">
                  Password
                  <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="Password"
                    value={password}
                    onChange={this.handleChange}
                  />
                </label>
                <label htmlFor="confirmPassword">
                  Confirm Your Password
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={this.handleChange}
                  />
                </label>

                <button type="submit">Reset{loading && 'ting'} your password{loading && '...'}</button>
              </fieldset>
            </Form>
          )
        }
      </Mutation>
    );
  }
}

export default Reset;