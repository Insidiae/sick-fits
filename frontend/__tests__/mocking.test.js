function Person(name, foods) {
  this.name = name;
  this.foods = foods;
}

Person.prototype.fetchFavFoods = function() {
  return new Promise((resolve, reject) => {
    // Simulating an API call
    setTimeout(() => resolve(this.foods), 2000);
  });
};

describe('Mocking 101', () => {
  it('mocks a reg function', () => {
    const fetchDogs = jest.fn();
    fetchDogs('snickers');
    expect(fetchDogs).toHaveBeenCalled();
    expect(fetchDogs).toHaveBeenCalledWith('snickers');
    fetchDogs('hugo');
    expect(fetchDogs).toHaveBeenCalledTimes(2);
  });
  it('can create a Person', () => {
    const me = new Person('KB', ['pizza', 'burgs']);
    expect(me.name).toBe('KB');
  });
  it('can fetch foods', async () => {
    const me = new Person('KB', ['pizza', 'burgs']);
    // Mock the fetchFavFoods function
    me.fetchFavFoods = jest.fn().mockResolvedValue(['pizza', 'ramen']);
    const favFoods = await me.fetchFavFoods();
    console.log(favFoods);
    expect(favFoods).toContain('pizza');
  })
});