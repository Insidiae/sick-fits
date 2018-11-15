import { mount } from 'enzyme';
import wait from 'waait';
import toJSON from 'enzyme-to-json';
import { MockedProvider } from 'react-apollo/test-utils';
import Nav from '../components/Nav';
import { CURRENT_USER_QUERY } from '../components/User';
import { fakeUser } from '../lib/testUtils';

const notSignedInMocks = [
  {
    request: { query: CURRENT_USER_QUERY },
    result: { data: { me: null } },
  },
];

const signedInMocks = [
  {
    request: { query: CURRENT_USER_QUERY },
    result: { data: { me: fakeUser() } },
  }
];

describe('<Nav/>', () => {
  it('renders a minimal nav when the user is signed out', async () => {
    const wrapper = mount(
      <MockedProvider mocks={notSignedInMocks}>
        <Nav />
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    // We need a more specific selector to avoid styled-components duplicating the items in the snapshot
    const nav = wrapper.find('ul[data-test="nav"]');
    expect(toJSON(nav)).toMatchSnapshot();
  });

  it('renders the full nav when the user is signen in', async () => {
    const wrapper = mount(
      <MockedProvider mocks={signedInMocks}>
        <Nav />
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    const nav = wrapper.find('ul[data-test="nav"]');
    // The full <Nav /> has 6 children in total
    // ( Shop, Sell, Orders, Account, Cart, Signout )
    // If you want to be more specific with your tests, you can write expect()s for those items as well
    expect(nav.children().length).toBe(6);
  });
  // You could also write a test to check if the number of cart items is being shown properly,
  // but we already did that in the <CartCount/> tests
});
