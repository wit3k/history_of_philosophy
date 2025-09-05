import Person from '../dto/Person';

const PeopleList = [
  new Person('1', 'Pan Testowy z Bardzo długim', 1820, 1901, 1),
  new Person('2', 'Drugi Pan', 1831, 1888, 2),
  new Person('3', 'Czeci Pan', 1810, 1848, 3),
  new Person('4', 'Czarta Pani', 1820, 1901, 4),
];

export default PeopleList.sort((p1, p2) => p1.born - p2.born);
