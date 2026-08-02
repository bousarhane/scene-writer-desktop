import {
  SqliteCharacterRelationRepository,
} from "../../database";

import {
  CharacterRelationService,
} from "./CharacterRelationService";

const characterRelationRepository =
  new SqliteCharacterRelationRepository();

export const characterRelationService =
  new CharacterRelationService(
    characterRelationRepository,
  );