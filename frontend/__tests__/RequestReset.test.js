import { mount } from 'enzyme';
import wait from 'waait';
import toJSON from 'enzyme-to-json';
import { MockedProvider } from 'react-apollo/test-utils';
import RequestReset, { REQUEST_RESET_MUTATION } from '../components/RequestReset';

const mocks = [
  {
    request: {
      query: REQUEST_RESET_MUTATION,
      variables: { email: 'test@email.com' },
    },
    result: {
      data: {
        requestReset: {
          __typename: 'Message',
          message: 'success',
        }
      }
    }
  }
];

describe('<RequestReset/>', () => {
  it('renders and matches the snapshot', () => {
    const wrapper = mount(
      <MockedProvider>
        <RequestReset />
      </MockedProvider>
    );
    const form = wrapper.find('form[data-test="form"]');
    expect(toJSON(form)).toMatchSnapshot();
  });

  it('calls the requestReset mutation', async () => {
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <RequestReset />
      </MockedProvider>
    );
    // Simulate typing an email
    wrapper.find('input').simulate('change', {
      target: {
        name: 'email',
        value: 'test@email.com',
      },
    });
    // Suimulate form submission
    wrapper.find('form').simulate('submit');
    await wait();
    wrapper.update();
    expect(wrapper.find('p').text()).toContain('Success! Check your email for a reset link.');
  })
});
