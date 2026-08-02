import {
  SqliteCharacterRepository,
} from "../../database";

import {
  CharacterService,
} from "./CharacterService";

const characterRepository =
  new SqliteCharacterRepository();

export const characterService =
  new CharacterService(
    characterRepository,
  );