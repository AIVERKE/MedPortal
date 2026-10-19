import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments, registerDecorator, ValidationOptions } from 'class-validator';

@ValidatorConstraint({ name: 'isTimeRangeValid', async: false })
export class IsTimeRangeValidConstraint implements ValidatorConstraintInterface {
  validate(horaFinReserva: string, args: ValidationArguments) {
    const object = args.object as any;
    const horaInicioReserva = object[args.constraints[0]];
    if (!horaInicioReserva || !horaFinReserva) {
      return true; // No validar si falta uno de los valores
    }
    return horaInicioReserva < horaFinReserva;
  }

  defaultMessage(args: ValidationArguments) {
    return 'La hora de inicio ($value) no puede ser posterior o igual a la hora de fin.';
  }
}

export function IsTimeRangeValid(property: string, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: IsTimeRangeValidConstraint,
    });
  };
}