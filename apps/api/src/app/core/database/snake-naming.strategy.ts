import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';

function camelToSnake(str: string): string {
  return str.replace(/([A-Z])/g, (_, c, i) => (i > 0 ? '_' : '') + c.toLowerCase());
}

export class SnakeNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
  columnName(propertyName: string, customName: string, embeddedPrefixes: string[]): string {
    const name = customName || camelToSnake(propertyName);
    return embeddedPrefixes.length
      ? camelToSnake(embeddedPrefixes.join('_')) + '_' + name
      : name;
  }

  joinColumnName(relationName: string, referencedColumnName: string): string {
    return camelToSnake(relationName) + '_' + referencedColumnName;
  }

  joinTableColumnName(tableName: string, propertyName: string, columnName?: string): string {
    return tableName + '_' + (columnName || camelToSnake(propertyName));
  }
}
