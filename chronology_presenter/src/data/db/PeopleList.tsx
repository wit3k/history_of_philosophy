import Person from '../dto/Person';

const PeopleList = [
  new Person('1', 'Pan Testowy z baaaadzo długim nazwiskiem', 1820, 1901, 1),
  new Person('2', 'Drugi Pan..', 1831, 1888, 2),
  new Person('3', 'Czeci Pan', 1810, 1848, 3),
  new Person('5', 'Pan Równoległy :)', 1850, 1888, 3),
  new Person('4', 'Czarta Pani', 1820, 1901, 4),
];
//.sort((p1, p2) => p1.born - p2.born);

export default PeopleList;
