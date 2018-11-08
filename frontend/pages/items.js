import Items from '../components/Items';

const Shop = props => (
  <div>
    <Items page={parseFloat(props.query.page) || 1} />
  </div>
);

export default Shop;
