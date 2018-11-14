import { shallow, mount } from 'enzyme';
import toJSON from 'enzyme-to-json';
import CartCount from '../components/CartCount';

describe('<CartCount/>', () => {
  // First make sure that the component actually renders before testing the snapshot
  it('renders', () => {
    shallow(<CartCount count={10} />);
  });
  it('matches the snapshot', () => {
    const wrapper = shallow(<CartCount count={11} />);
    expect(toJSON(wrapper)).toMatchSnapshot();
  });
  it('updates via props', () => {
    const wrapper = shallow(<CartCount count={10} />);
    expect(toJSON(wrapper)).toMatchSnapshot();
    wrapper.setProps({ count: 11 })
    expect(toJSON(wrapper)).toMatchSnapshot();
  })
});