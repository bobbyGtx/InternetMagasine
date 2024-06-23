export type ActiveParamsType = {
  types: string[],//Типы которые будут у этого объекта
  heightFrom?:string,
  heightTo?:string,
  diameterFrom?:string,
  diameterTo?:string,
  sort?:string,//Сортировка
  page?:number,//Для пагинации
}
