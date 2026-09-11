from enum import StrEnum


class Operador(StrEnum):
    IGUAL = '='
    ILIKE = 'ILIKE'
    MAIOR = '>'
    MAIOR_IGUAL = '>='
    MENOR = '<'
    MENOR_IGUAL = '<='
