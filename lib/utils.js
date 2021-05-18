const uniq = (array, iterator) => {
  if (iterator) return [...(new Map(array.map(x => [iterator(x), x]))).values()]
  else return [...new Set(array)]
}

module.exports.uniq = uniq
