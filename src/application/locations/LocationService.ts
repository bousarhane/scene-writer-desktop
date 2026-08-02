import type {
  Location,
  LocationType,
  UUID,
} from "../../types";

import type {
  LocationRepository,
} from "../../database";

export interface CreateLocationInput {
  projectId: UUID;

  parentLocationId?: UUID | null;

  name: string;
  type?: LocationType;

  description?: string | null;
  notes?: string | null;
}

export interface UpdateLocationInput {
  parentLocationId: UUID | null;

  name: string;
  type: LocationType;

  description: string | null;
  notes: string | null;
}

export class LocationValidationError
  extends Error
{
  constructor(
    public readonly errors: string[],
  ) {
    super(errors.join("\n"));

    this.name =
      "LocationValidationError";
  }
}

export class LocationService {
  constructor(
    private readonly repository:
      LocationRepository,
  ) {}

  async listLocations(
    projectId: UUID,
  ): Promise<Location[]> {
    return this.repository
      .findByProjectId(projectId);
  }

  async getLocation(
    id: UUID,
  ): Promise<Location | null> {
    return this.repository
      .findById(id);
  }

  async createLocation(
    input: CreateLocationInput,
  ): Promise<Location> {
    const name =
      normalizeRequiredName(
        input.name,
      );

    const parentLocationId =
      input.parentLocationId ??
      null;

    await this.validateParentLocation(
      input.projectId,
      parentLocationId,
    );

    await this.ensureUniqueName(
      input.projectId,
      name,
    );

    const now =
      new Date().toISOString();

    const location: Location = {
      id: crypto.randomUUID(),
      projectId: input.projectId,

      parentLocationId,

      name,

      type:
        input.type ??
        "other",

      description:
        normalizeOptionalText(
          input.description,
        ),

      notes:
        normalizeOptionalText(
          input.notes,
        ),

      createdAt: now,
      updatedAt: now,
    };

    await this.repository.create(
      location,
    );

    return location;
  }

  async updateLocation(
    id: UUID,
    input: UpdateLocationInput,
  ): Promise<Location> {
    const existingLocation =
      await this.requireLocation(id);

    const name =
      normalizeRequiredName(
        input.name,
      );

    if (
      input.parentLocationId ===
      existingLocation.id
    ) {
      throw new LocationValidationError([
        "لا يمكن جعل المكان تابعًا لنفسه.",
      ]);
    }

    await this.validateParentLocation(
      existingLocation.projectId,
      input.parentLocationId,
    );

    await this.ensureUniqueName(
      existingLocation.projectId,
      name,
      existingLocation.id,
    );

    if (
      input.parentLocationId !== null
    ) {
      await this.ensureNoCircularHierarchy(
        existingLocation.id,
        input.parentLocationId,
      );
    }

    const updatedLocation: Location = {
      ...existingLocation,

      parentLocationId:
        input.parentLocationId,

      name,
      type: input.type,

      description:
        normalizeOptionalText(
          input.description,
        ),

      notes:
        normalizeOptionalText(
          input.notes,
        ),

      updatedAt:
        new Date().toISOString(),
    };

    await this.repository.update(
      updatedLocation,
    );

    return updatedLocation;
  }

  async deleteLocation(
    id: UUID,
  ): Promise<void> {
    await this.repository.delete(id);
  }

  private async ensureUniqueName(
    projectId: UUID,
    name: string,
    excludedLocationId?: UUID,
  ): Promise<void> {
    const locations =
      await this.repository
        .findByProjectId(projectId);

    const normalizedName =
      normalizeComparableText(name);

    const duplicate =
      locations.some(
        (location) =>
          location.id !==
            excludedLocationId &&
          normalizeComparableText(
            location.name,
          ) === normalizedName,
      );

    if (duplicate) {
      throw new LocationValidationError([
        `يوجد في المشروع مكان يحمل الاسم «${name}».`,
      ]);
    }
  }

  private async validateParentLocation(
    projectId: UUID,
    parentLocationId: UUID | null,
  ): Promise<void> {
    if (parentLocationId === null) {
      return;
    }

    const parentLocation =
      await this.repository.findById(
        parentLocationId,
      );

    if (
      parentLocation === null ||
      parentLocation.projectId !==
        projectId
    ) {
      throw new LocationValidationError([
        "المكان الأب غير موجود داخل هذا المشروع.",
      ]);
    }
  }

  private async ensureNoCircularHierarchy(
    locationId: UUID,
    parentLocationId: UUID,
  ): Promise<void> {
    const visitedIds =
      new Set<UUID>();

    let currentLocationId:
      UUID | null =
        parentLocationId;

    while (
      currentLocationId !== null
    ) {
      if (
        currentLocationId ===
        locationId
      ) {
        throw new LocationValidationError([
          "لا يمكن إنشاء تسلسل دائري بين الأماكن.",
        ]);
      }

      if (
        visitedIds.has(
          currentLocationId,
        )
      ) {
        throw new LocationValidationError([
          "اكتُشف تسلسل دائري غير صالح بين الأماكن.",
        ]);
      }

      visitedIds.add(
        currentLocationId,
      );

      const currentLocation =
        await this.repository.findById(
          currentLocationId,
        );

      currentLocationId =
        currentLocation
          ?.parentLocationId ??
        null;
    }
  }

  private async requireLocation(
    id: UUID,
  ): Promise<Location> {
    const location =
      await this.repository.findById(
        id,
      );

    if (location === null) {
      throw new Error(
        "المكان المطلوب غير موجود.",
      );
    }

    return location;
  }
}

function normalizeRequiredName(
  value: string,
): string {
  const normalized =
    normalizeSpacing(value);

  if (!normalized) {
    throw new LocationValidationError([
      "اسم المكان إلزامي.",
    ]);
  }

  return normalized;
}

function normalizeOptionalText(
  value: string | null | undefined,
): string | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const normalized =
    value.trim();

  return normalized || null;
}

function normalizeComparableText(
  value: string,
): string {
  return normalizeSpacing(value)
    .toLocaleLowerCase();
}

function normalizeSpacing(
  value: string,
): string {
  return value
    .trim()
    .replace(/\s+/g, " ");
}