import { mount } from 'enzyme';
import wait from 'waait';
import toJSON from 'enzyme-to-json';
import { ApolloConsumer } from 'react-apollo';
import { MockedProvider } from 'react-apollo/test-utils';
import Router from 'next/router';
import Signup, { SIGNUP_MUTATION } from '../components/Signup';
import { CURRENT_USER_QUERY } from '../components/User';
import { fakeUser } from '../lib/testUtils';

Router.router = { push: jest.fn() };

const me = fakeUser();
const mocks = [
  // SIGNUP_MUTATION mock
  {
    request: {
      query: SIGNUP_MUTATION,
      variables: {
        name: me.name,
        email: me.email,
        password: 'test123',
      },
    },
    result: {
      data: {
        signup: {
          __typename: 'User',
          id: 'abc123',
          email: me.email,
          name: me.name,
        }
      }
    }
  },
  // CURRENT_USER_QUERY mock
  {
    request: { query: CURRENT_USER_QUERY },
    result: { data: { me } },
  },
];

function type(wrapper, name, value) {
  wrapper.find(`input[name="${name}"]`).simulate('change', {
    target: { name, value }
  });
}

describe('<Signup/>', () => {
  it('renders and matches snapshot', async () => {
    const wrapper = mount(
      <MockedProvider>
        <Signup />
      </MockedProvider>
    );
    expect(toJSON(wrapper.find('form'))).toMatchSnapshot();
  });

  it('calls the SIGNUP_MUTATION properly', async () => {
    let apolloClient;
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <ApolloConsumer>
          {client => {
            apolloClient = client;
            return <Signup />
          }}
        </ApolloConsumer>
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    type(wrapper, 'name', me.name);
    type(wrapper, 'email', me.email);
    type(wrapper, 'password', 'test123');
    await wait();
    wrapper.update();
    wrapper.find('form').simulate('submit');
    await wait();

    // query the user out of the Apollo Client
    const user = await apolloClient.query({ query: CURRENT_USER_QUERY });

    // Check that the newly signed up user's data is now in the Apollo Client
    expect(user.data.me).toMatchObject(me);
  });
});
