#include <emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/val.h>
#include "PxPhysicsAPI.h"
#include <PsSocket.h>
#include <chrono>
#include <PsString.h>

using namespace physx;
using namespace emscripten;

#if PX_DEBUG || PX_PROFILE || PX_CHECKED || PX_SUPPORT_PVD

struct PxPvdTransportWrapper : public wrapper<PxPvdTransport>
{
    EMSCRIPTEN_WRAPPER(PxPvdTransportWrapper)

    void unlock() override {}

    void flush() override {}

    void release() override {}

    PxPvdTransport &lock() override { return *this; }

    uint64_t getWrittenDataSize() override { return 0; }

    bool connect() override { return call<bool>("connect"); }

    void disconnect() override { call<void>("disconnect"); }

    bool isConnected() override { return call<bool>("isConnected"); }

    bool write(const uint8_t *inBytes, uint32_t inLength) override
    {
        return call<bool>("write", int(inBytes), int(inLength));
    }
};

#endif

// add by hzy
// store user data
struct ShapeUserData
{
public:
    int id;
    bool isTrigger;

    ShapeUserData()
    {
        id = 0;
        isTrigger = 0;
    }
};

struct ActorUserData
{
public:
    int id;
    ActorUserData()
    {
        id = 0;
    }
};

//----------------------------------------------------------------------------------------------------------------------
struct PxRaycastCallbackWrapper : public wrapper<PxRaycastCallback>
{
    EMSCRIPTEN_WRAPPER(explicit PxRaycastCallbackWrapper)

    PxAgain processTouches(const PxRaycastHit *buffer, PxU32 nbHits) override
    {
        for (PxU32 i = 0; i < nbHits; i++)
        {
            bool again = call<PxAgain>("processTouches", buffer[i]);
            if (!again)
            {
                return false;
            }
        }
        return true;
    }
};

PxRaycastHit *allocateRaycastHitBuffers(PxU32 nb)
{
    auto *myArray = new PxRaycastHit[nb];
    return myArray;
}

//----------------------------------------------------------------------------------------------------------------------
struct PxSweepCallbackWrapper : public wrapper<PxSweepCallback>
{
    EMSCRIPTEN_WRAPPER(explicit PxSweepCallbackWrapper)

    PxAgain processTouches(const PxSweepHit *buffer, PxU32 nbHits) override
    {
        for (PxU32 i = 0; i < nbHits; i++)
        {
            bool again = call<PxAgain>("processTouches", buffer[i]);
            if (!again)
            {
                return false;
            }
        }
        return true;
    }
};

PxSweepHit *allocateSweepHitBuffers(PxU32 nb)
{
    auto *myArray = new PxSweepHit[nb];
    return myArray;
}

//----------------------------------------------------------------------------------------------------------------------
struct PxQueryFilterCallbackWrapper : public wrapper<PxQueryFilterCallback>
{
    EMSCRIPTEN_WRAPPER(explicit PxQueryFilterCallbackWrapper)

    PxQueryHitType::Enum postFilter(const PxFilterData &filterData, const PxQueryHit &hit) override
    {
        return call<PxQueryHitType::Enum>("postFilter", filterData, hit);
    }

    PxQueryHitType::Enum
    preFilter(const PxFilterData &filterData, const PxShape *shape, const PxRigidActor *actor, PxHitFlags &) override
    {
        auto hitType = call<PxQueryHitType::Enum>("preFilter", filterData, shape, actor);
        return hitType;
    }
};

struct PxUserControllerHitReportPublic : public PxUserControllerHitReport
{
public:
    virtual ~PxUserControllerHitReportPublic()
    {
    }
};

// copy from SampleCCTActor.cpp
struct DefaultUserControllerHitReport : public PxUserControllerHitReportPublic
{
    static void addForceAtPosInternal(PxRigidBody &body, const PxVec3 &force, const PxVec3 &pos, PxForceMode::Enum mode, bool wakeup)
    {
        /*	if(mode == PxForceMode::eACCELERATION || mode == PxForceMode::eVELOCITY_CHANGE)
            {
                Ps::getFoundation().error(PxErrorCode::eINVALID_PARAMETER, __FILE__, __LINE__,
                    "PxRigidBodyExt::addForce methods do not support eACCELERATION or eVELOCITY_CHANGE modes");
                return;
            }*/

        const PxTransform globalPose = body.getGlobalPose();
        const PxVec3 centerOfMass = globalPose.transform(body.getCMassLocalPose().p);

        const PxVec3 torque = (pos - centerOfMass).cross(force);
        body.addForce(force, mode, wakeup);
        body.addTorque(torque, mode, wakeup);
    }
    static void addForceAtLocalPos(PxRigidBody &body, const PxVec3 &force, const PxVec3 &pos, PxForceMode::Enum mode, bool wakeup = true)
    {
        // transform pos to world space
        const PxVec3 globalForcePos = body.getGlobalPose().transform(pos);

        addForceAtPosInternal(body, force, globalForcePos, mode, wakeup);
    }
    virtual void onShapeHit(const PxControllerShapeHit &hit)
    {
        PxRigidDynamic *actor = hit.shape->getActor()->is<PxRigidDynamic>();
        if (actor)
        {
            if (actor->getRigidBodyFlags() & PxRigidBodyFlag::eKINEMATIC)
                return;
            // copy from SampleNorthPole
            //  We only allow horizontal pushes. Vertical pushes when we stand on dynamic objects creates
            //  useless stress on the solver. It would be possible to enable/disable vertical pushes on
            //  particular objects, if the gameplay requires it.

            if (hit.dir.y == 0.0f)
            {
                PxReal coeff = actor->getMass() * hit.length;
                PxRigidBodyExt::addForceAtLocalPos(*actor, hit.dir * coeff, PxVec3(0, 0, 0), PxForceMode::eIMPULSE);

                // auto v = hit.controller->getActor()->getLinearVelocity();
                // auto m = hit.controller->getActor()->getMass();
                // PxVec3 vv = m * hit.dir / actor->getMass();
                // actor->setLinearVelocity(vv);
            }
            else if (hit.dir.y == -1.0f)
            { //下部碰撞是-1，其他情况先不管
                auto v = hit.controller->getActor()->getLinearVelocity();
                auto m = hit.controller->getActor()->getMass();
                // emscripten_log(EM_LOG_WARN, "%f %f %f", v.x, v.y, v.z);
                // moving
                if (v.x != 0.0 || v.y != 0.0 || v.z != 0.0)
                {
                    // PxReal coeff = actor->getMass() * hit.length * -1;
                    // PxRigidBodyExt::addForceAtLocalPos(*actor, v * coeff, PxVec3(0, 0, 0), PxForceMode::eIMPULSE);
                    // PxVec3 vv = m * v / actor->getMass();
                    // vv.y = 0;
                    // actor->setLinearVelocity(vv.multiply(PxVec3(-1, -1, -1)));
                }
                else
                {
                    // back
                    auto velocity = actor->getLinearVelocity();
                    velocity = velocity.multiply(PxVec3(-1, -1, -1));
                    actor->setLinearVelocity(velocity);
                }
            }
        }
    };

    virtual void onControllerHit(const PxControllersHit &hit){

    };

    virtual void onObstacleHit(const PxControllerObstacleHit &hit){

    };
};

struct PxUserControllerHitReportWrapper : public wrapper<PxUserControllerHitReportPublic>
{
    EMSCRIPTEN_WRAPPER(explicit PxUserControllerHitReportWrapper)

    virtual void onShapeHit(const PxControllerShapeHit &hit)
    {
        call<void>("onShapeHit", hit.actor, hit.shape);
    };

    virtual void onControllerHit(const PxControllersHit &hit){

    };

    virtual void onObstacleHit(const PxControllerObstacleHit &hit){

    };
};

struct PxControllerBehaviorCallbackPublic : public PxControllerBehaviorCallback
{
public:
    virtual ~PxControllerBehaviorCallbackPublic()
    {
    }
};

struct DefaultControllerBehaviorCallback : public PxControllerBehaviorCallbackPublic
{
    virtual PxControllerBehaviorFlags getBehaviorFlags(const PxShape &shape, const PxActor &actor)
    {
        return PxControllerBehaviorFlag::eCCT_CAN_RIDE_ON_OBJECT | PxControllerBehaviorFlag::eCCT_SLIDE;
    };
    virtual PxControllerBehaviorFlags getBehaviorFlags(const PxController &controller)
    {
        return PxControllerBehaviorFlags(0);
    };
    virtual PxControllerBehaviorFlags getBehaviorFlags(const PxObstacle &obstacle)
    {
        return PxControllerBehaviorFlag::eCCT_CAN_RIDE_ON_OBJECT | PxControllerBehaviorFlag::eCCT_SLIDE;
    };
};

//----------------------------------------------------------------------------------------------------------------------
struct PxSimulationEventCallbackWrapper : public wrapper<PxSimulationEventCallback>
{
    EMSCRIPTEN_WRAPPER(explicit PxSimulationEventCallbackWrapper)

    void onConstraintBreak(PxConstraintInfo *, PxU32) override {}

    void onWake(PxActor **, PxU32) override {}

    void onSleep(PxActor **, PxU32) override {}

    void onContact(const PxContactPairHeader &header, const PxContactPair *pairs, PxU32 nbPairs) override
    {
        // emscripten_log(EM_LOG_WARN, "nbPairs %d", nbPairs);
        for (PxU32 i = 0; i < nbPairs; i++)
        {
            const PxContactPair &cp = pairs[i];
            if (cp.events & (PxPairFlag::eNOTIFY_TOUCH_FOUND))
            {
                // emscripten_log(EM_LOG_WARN, "touch %d", (uint32_t)(cp.events));
                int actorId0 = header.actors[0]->userData ? ((ActorUserData *)(header.actors[0]->userData))->id : 0;
                int shapeId0 = cp.shapes[0]->userData ? ((ShapeUserData *)(cp.shapes[0]->userData))->id : 0;
                int actorId1 = header.actors[1]->userData ? ((ActorUserData *)(header.actors[1]->userData))->id : 0;
                int shapeId1 = cp.shapes[1]->userData ? ((ShapeUserData *)(cp.shapes[1]->userData))->id : 0;
                call<void>("onContactBegin", actorId0, shapeId0, actorId1, shapeId1);
            }
            else if (cp.events & PxPairFlag::eNOTIFY_TOUCH_LOST)
            {
                // emscripten_log(EM_LOG_WARN, "lost  %d", uint32_t(cp.events));
                auto actorId0 = ((header.flags & PxContactPairHeaderFlag::eREMOVED_ACTOR_0) || !(header.actors[0]->userData)) ? 0 : ((ActorUserData *)(header.actors[0]->userData))->id;
                auto actorId1 = ((header.flags & PxContactPairHeaderFlag::eREMOVED_ACTOR_1) || !(header.actors[1]->userData)) ? 0 : ((ActorUserData *)(header.actors[1]->userData))->id;
                auto shapeId0 = ((cp.flags & PxContactPairFlag::eREMOVED_SHAPE_0) || !(cp.shapes[0]->userData)) ? 0 : ((ShapeUserData *)(cp.shapes[0]->userData))->id;
                auto shapeId1 = ((cp.flags & PxContactPairFlag::eREMOVED_SHAPE_1) || !(cp.shapes[1]->userData)) ? 0 : ((ShapeUserData *)(cp.shapes[1]->userData))->id;
                call<void>("onContactEnd", actorId0, shapeId0, actorId1, shapeId1);
            }
        }
    }
    /**
     * No Trigger Event
     */
    void onTrigger(PxTriggerPair *pairs, PxU32 count) override
    {

        // emscripten_log(EM_LOG_ERROR, "onTrigger %d", count);
        for (PxU32 i = 0; i < count; i++)
        {
            PxTriggerPair &tp = pairs[i];
            if (tp.status & PxPairFlag::eNOTIFY_TOUCH_FOUND)
            {
                call<void>("onTriggerBegin",
                           tp.triggerActor,
                           tp.triggerShape,
                           tp.otherActor,
                           tp.otherShape);
            }
            else if (tp.status & PxPairFlag::eNOTIFY_TOUCH_LOST)
            {
                call<void>("onTriggerEnd",
                           tp.triggerActor,
                           tp.triggerShape,
                           tp.otherActor,
                           tp.otherShape);
            }
        }
    }
    void onAdvance(const PxRigidBody *const *, const PxTransform *, const PxU32) override {}
};

PxFilterFlags DefaultFilterShader(
    PxFilterObjectAttributes attributes0, PxFilterData,
    PxFilterObjectAttributes attributes1, PxFilterData,
    PxPairFlags &pairFlags, const void *, PxU32)
{
    // return eCALLBACK to call PxSimulationFilterCallback
    pairFlags = PxPairFlag::eCONTACT_DEFAULT;
    pairFlags |= PxPairFlag::eDETECT_CCD_CONTACT | PxPairFlag::eNOTIFY_TOUCH_CCD;
    return PxFilterFlag::eCALLBACK;
}

PxFilterFlags DefaultCCDFilterShader(
    PxFilterObjectAttributes attributes0,
    PxFilterData filterData0,
    PxFilterObjectAttributes attributes1,
    PxFilterData filterData1,
    PxPairFlags &pairFlags,
    const void *constantBlock,
    PxU32 constantBlockSize)
{

    // let triggers through
    if (PxFilterObjectIsTrigger(attributes0) || PxFilterObjectIsTrigger(attributes1))
    {
        pairFlags = PxPairFlag::eTRIGGER_DEFAULT;
        return PxFilterFlags();
    }
    else
    {
        pairFlags = PxPairFlag::eSOLVE_CONTACT;
        pairFlags |= PxPairFlag::eDETECT_DISCRETE_CONTACT;
        pairFlags |= PxPairFlag::eDETECT_CCD_CONTACT;
        pairFlags |= PxPairFlag::eCONTACT_DEFAULT;
        pairFlags |= PxPairFlag::eNOTIFY_TOUCH_FOUND;
        pairFlags |= PxPairFlag::eNOTIFY_TOUCH_LOST;
        pairFlags |= PxPairFlag::eNOTIFY_TOUCH_PERSISTS;
        return PxFilterFlags();
    }
}

class TriggerSimulationFilterCallback : public PxSimulationFilterCallback
{
    virtual PxFilterFlags pairFound(PxU32 pairID,
                                    PxFilterObjectAttributes attributes0, PxFilterData filterData0, const PxActor *a0, const PxShape *s0,
                                    PxFilterObjectAttributes attributes1, PxFilterData filterData1, const PxActor *a1, const PxShape *s1,
                                    PxPairFlags &pairFlags)
    {
        if (((ShapeUserData *)(s0->userData))->isTrigger || ((ShapeUserData *)(s1->userData))->isTrigger)
        {
            // trigger
            pairFlags = PxPairFlag::eTRIGGER_DEFAULT;
            pairFlags |= PxPairFlag::eNOTIFY_TOUCH_FOUND | PxPairFlag::eNOTIFY_TOUCH_LOST | PxPairFlag::eDETECT_CCD_CONTACT | PxPairFlag::eNOTIFY_TOUCH_CCD;
        }
        else
        {
            // contact
            pairFlags = PxPairFlag::eCONTACT_DEFAULT;
            pairFlags |= PxPairFlag::eNOTIFY_TOUCH_FOUND | PxPairFlag::eNOTIFY_TOUCH_LOST | PxPairFlag::eDETECT_CCD_CONTACT | PxPairFlag::eNOTIFY_TOUCH_CCD;
        }
        return PxFilterFlags();
    }
    virtual void pairLost(PxU32 pairID,
                          PxFilterObjectAttributes attributes0,
                          PxFilterData filterData0,
                          PxFilterObjectAttributes attributes1,
                          PxFilterData filterData1,
                          bool objectRemoved) {}

    virtual bool statusChange(PxU32 &pairID, PxPairFlags &pairFlags, PxFilterFlags &filterFlags) { return false; };
};

// TODO: Getting the  global PxDefaultSimulationFilterShader into javascript
// is problematic, so let's provide this custom factory function for now
PxSceneDesc *getDefaultSceneDesc(PxTolerancesScale &scale, int numThreads, PxSimulationEventCallback *callback)
{
    auto *sceneDesc = new PxSceneDesc(scale);
    sceneDesc->gravity = PxVec3(0.0f, -9.81f, 0.0f);
    sceneDesc->cpuDispatcher = PxDefaultCpuDispatcherCreate(numThreads);

    sceneDesc->filterShader = DefaultFilterShader;
    sceneDesc->filterCallback = new TriggerSimulationFilterCallback();

    sceneDesc->simulationEventCallback = callback;
    sceneDesc->kineKineFilteringMode = PxPairFilteringMode::eKEEP;
    sceneDesc->staticKineFilteringMode = PxPairFilteringMode::eKEEP;
    sceneDesc->flags |= PxSceneFlag::eENABLE_CCD;
    sceneDesc->flags |= PxSceneFlag::eENABLE_PCM;
    // for get active actors
    // sceneDesc->flags |= PxSceneFlag::eENABLE_ACTIVE_ACTORS;
    sceneDesc->flags |= PxSceneFlag::eENABLE_STABILIZATION;
    return sceneDesc;
}

//----------------------------------------------------------------------------------------------------------------------
PxConvexMesh *createConvexMesh(std::vector<PxVec3> &vertices, PxCooking &cooking, PxPhysics &physics)
{
    PxConvexMeshDesc convexDesc;
    convexDesc.points.count = vertices.size();
    convexDesc.points.stride = sizeof(PxVec3);
    convexDesc.points.data = vertices.data();
    convexDesc.flags = PxConvexFlag::eCOMPUTE_CONVEX;

    PxConvexMesh *convexMesh = cooking.createConvexMesh(convexDesc, physics.getPhysicsInsertionCallback());

    return convexMesh;
}

PxConvexMesh *createConvexMeshFromBuffer(int vertices, PxU32 vertCount, PxCooking &cooking, PxPhysics &physics)
{
    PxConvexMeshDesc convexDesc;
    convexDesc.points.count = vertCount;
    convexDesc.points.stride = sizeof(PxVec3);
    convexDesc.points.data = (PxVec3 *)vertices;
    convexDesc.flags = PxConvexFlag::eCOMPUTE_CONVEX;

    PxConvexMesh *convexMesh = cooking.createConvexMesh(convexDesc, physics.getPhysicsInsertionCallback());

    return convexMesh;
}

PxTriangleMesh *
createTriMesh(int vertices, PxU32 vertCount, int indices, PxU32 indexCount, bool isU16, PxCooking &cooking,
              PxPhysics &physics)
{
    PxTriangleMeshDesc meshDesc;
    meshDesc.points.count = vertCount;
    meshDesc.points.stride = sizeof(PxVec3);
    meshDesc.points.data = (PxVec3 *)vertices;

    meshDesc.triangles.count = indexCount;
    if (isU16)
    {
        meshDesc.triangles.stride = 3 * sizeof(PxU16);
        meshDesc.triangles.data = (PxU16 *)indices;
        meshDesc.flags = PxMeshFlag::e16_BIT_INDICES;
    }
    else
    {
        meshDesc.triangles.stride = 3 * sizeof(PxU32);
        meshDesc.triangles.data = (PxU32 *)indices;
    }
#if 1
    PxDefaultMemoryOutputStream writeBuffer;
    bool status = cooking.cookTriangleMesh(meshDesc, writeBuffer);
    if (!status)
        return NULL;
    PxDefaultMemoryInputData readBuffer(writeBuffer.getData(), writeBuffer.getSize());
    PxTriangleMesh *triangleMesh = physics.createTriangleMesh(readBuffer);
    return triangleMesh;
#else
    PxTriangleMesh *triangleMesh = cooking.createTriangleMesh(meshDesc, physics.getPhysicsInsertionCallback());
    return triangleMesh;
#endif
}

class ControllerQueryFilterCallback : public PxQueryFilterCallback
{
public:
    virtual PxQueryHitType::Enum preFilter(const PxFilterData &filterData, const PxShape *shape, const PxRigidActor *actor, PxHitFlags &queryFlags)
    {
        if (shape->userData && ((ShapeUserData *)(shape->userData))->isTrigger)
        {
            return PxQueryHitType::eNONE;
        }
        return PxQueryHitType::eBLOCK;
    }
    virtual PxQueryHitType::Enum postFilter(const PxFilterData &filterData, const PxQueryHit &hit)
    {
        return PxQueryHitType::eBLOCK;
    }
    virtual ~ControllerQueryFilterCallback() {}
};
static auto ControllerQueryFilterCallbackInstance = new ControllerQueryFilterCallback();

//----------------------------------------------------------------------------------------------------------------------
EMSCRIPTEN_BINDINGS(physx)
{
#if PX_DEBUG || PX_PROFILE || PX_CHECKED || PX_SUPPORT_PVD
    class_<PxPvdTransport>("PxPvdTransport")
        .allow_subclass<PxPvdTransportWrapper>("PxPvdTransportWrapper", constructor<>());

    function("PxCreatePvd", &PxCreatePvd, allow_raw_pointers());

    class_<PxPvdInstrumentationFlags>("PxPvdInstrumentationFlags").constructor<int>();
    enum_<PxPvdInstrumentationFlag::Enum>("PxPvdInstrumentationFlag")
        .value("eALL", PxPvdInstrumentationFlag::Enum::eALL)
        .value("eDEBUG", PxPvdInstrumentationFlag::Enum::eDEBUG)
        .value("ePROFILE", PxPvdInstrumentationFlag::Enum::ePROFILE)
        .value("eMEMORY", PxPvdInstrumentationFlag::Enum::eMEMORY);

#endif
    class_<PxPvd>("PxPvd")
        .function("connect", &PxPvd::connect)
        .function("disconnect", &PxPvd::disconnect)
        .function("release", &PxPvd::release);

    constant("PX_PHYSICS_VERSION", PX_PHYSICS_VERSION);

    // Global functions
    // These are generally system/scene level initialization
    function("PxCreateFoundation", &PxCreateFoundation, allow_raw_pointers());
    function("PxInitExtensions", &PxInitExtensions, allow_raw_pointers());
    function("PxCloseExtensions", &PxCloseExtensions, allow_raw_pointers());
    function("PxDefaultCpuDispatcherCreate", &PxDefaultCpuDispatcherCreate, allow_raw_pointers());
    function("PxCreatePhysics", &PxCreateBasePhysics, allow_raw_pointers());
    function("PxCreateCooking", &PxCreateCooking, allow_raw_pointers());
    function("PxCreatePlane", &PxCreatePlane, allow_raw_pointers());
    function("getDefaultSceneDesc", &getDefaultSceneDesc, allow_raw_pointers());
    function("PxDefaultSimulationFilterShader", &PxDefaultSimulationFilterShader, allow_raw_pointers());

    class_<PxSimulationEventCallback>("PxSimulationEventCallback")
        .allow_subclass<PxSimulationEventCallbackWrapper>("PxSimulationEventCallbackWrapper");

    /* PhysXJoint ✅ */
    class_<PxJoint>("PxJoint")
        .function("setActors", &PxJoint::setActors, allow_raw_pointers()) // ✅
        .function("setLocalPose", optional_override(
                                      [](PxJoint &joint, int actor, const PxVec3 &position, const PxQuat &rotation)
                                      {
                                          joint.setLocalPose(PxJointActorIndex::Enum(actor), PxTransform(position, rotation));
                                      }))                   // ✅
        .function("setBreakForce", &PxJoint::setBreakForce) // ✅
        .function("setConstraintFlag", optional_override(
                                           [](PxJoint &joint, int flag, bool value)
                                           {
                                               joint.setConstraintFlag(PxConstraintFlag::Enum(flag), value);
                                           }))                          // ✅
        .function("setInvMassScale0", &PxJoint::setInvMassScale0)       // ✅
        .function("setInvInertiaScale0", &PxJoint::setInvInertiaScale0) // ✅
        .function("setInvMassScale1", &PxJoint::setInvMassScale1)       // ✅
        .function("setInvInertiaScale1", &PxJoint::setInvInertiaScale1) // ✅
        .function("release", &PxJoint::release);
    /* PhysXFixedJoint ✅ */
    class_<PxFixedJoint, base<PxJoint>>("PxFixedJoint")
        .function("setProjectionLinearTolerance", &PxFixedJoint::setProjectionLinearTolerance)    // ✅
        .function("setProjectionAngularTolerance", &PxFixedJoint::setProjectionAngularTolerance); // ✅
    /* PhysXSphericalJoint ✅ */
    class_<PxSphericalJoint, base<PxJoint>>("PxSphericalJoint")
        .function("setHardLimitCone", optional_override(
                                          [](PxSphericalJoint &joint, PxReal yLimitAngle, PxReal zLimitAngle, PxReal contactDist)
                                          {
                                              joint.setLimitCone(PxJointLimitCone(yLimitAngle, zLimitAngle, contactDist));
                                          })) // ✅
        .function("setSoftLimitCone", optional_override(
                                          [](PxSphericalJoint &joint, PxReal yLimitAngle, PxReal zLimitAngle, PxReal stiffness,
                                             PxReal damping)
                                          {
                                              joint.setLimitCone(PxJointLimitCone(yLimitAngle, zLimitAngle, PxSpring(stiffness, damping)));
                                          })) // ✅
        .function("setSphericalJointFlag", optional_override(
                                               [](PxSphericalJoint &joint, PxReal flag, bool value)
                                               {
                                                   joint.setSphericalJointFlag(PxSphericalJointFlag::Enum(flag), value);
                                               }))                                                  // ✅
        .function("setProjectionLinearTolerance", &PxSphericalJoint::setProjectionLinearTolerance); // ✅
    /* PhysXHingeJoint ✅ */
    class_<PxRevoluteJoint, base<PxJoint>>("PxRevoluteJoint")
        .function("setHardLimit", optional_override(
                                      [](PxRevoluteJoint &joint, PxReal lowerLimit, PxReal upperLimit, PxReal contactDist)
                                      {
                                          joint.setLimit(PxJointAngularLimitPair(lowerLimit, upperLimit, contactDist));
                                      })) // ✅
        .function("setSoftLimit", optional_override(
                                      [](PxRevoluteJoint &joint, PxReal lowerLimit, PxReal upperLimit, PxReal stiffness,
                                         PxReal damping)
                                      {
                                          joint.setLimit(PxJointAngularLimitPair(lowerLimit, upperLimit, PxSpring(stiffness, damping)));
                                      }))                                     // ✅
        .function("setDriveVelocity", &PxRevoluteJoint::setDriveVelocity)     // ✅
        .function("setDriveForceLimit", &PxRevoluteJoint::setDriveForceLimit) // ✅
        .function("setDriveGearRatio", &PxRevoluteJoint::setDriveGearRatio)   // ✅
        .function("setRevoluteJointFlag", optional_override(
                                              [](PxRevoluteJoint &joint, PxReal flag, bool value)
                                              {
                                                  joint.setRevoluteJointFlag(PxRevoluteJointFlag::Enum(flag), value);
                                              }))                                                    // ✅
        .function("setProjectionLinearTolerance", &PxRevoluteJoint::setProjectionLinearTolerance)    // ✅
        .function("setProjectionAngularTolerance", &PxRevoluteJoint::setProjectionAngularTolerance); // ✅
    /* PhysXSpringJoint ✅ */
    class_<PxDistanceJoint, base<PxJoint>>("PxDistanceJoint")
        .function("setMinDistance", &PxDistanceJoint::setMinDistance) // ✅
        .function("setMaxDistance", &PxDistanceJoint::setMaxDistance) // ✅
        .function("setTolerance", &PxDistanceJoint::setTolerance)     // ✅
        .function("setStiffness", &PxDistanceJoint::setStiffness)     // ✅
        .function("setDamping", &PxDistanceJoint::setDamping)         // ✅
        .function("setDistanceJointFlag", optional_override(
                                              [](PxDistanceJoint &joint, PxReal flag, bool value)
                                              {
                                                  joint.setDistanceJointFlag(PxDistanceJointFlag::Enum(flag), value);
                                              })); // ✅
    /* PhysXTranslationalJoint ✅ */
    class_<PxPrismaticJoint, base<PxJoint>>("PxPrismaticJoint")
        .function("setHardLimit", optional_override(
                                      [](PxPrismaticJoint &joint, PxTolerancesScale &scale, PxReal lowerLimit, PxReal upperLimit,
                                         PxReal contactDist)
                                      {
                                          joint.setLimit(PxJointLinearLimitPair(scale, lowerLimit, upperLimit, contactDist));
                                      })) // ✅
        .function("setSoftLimit", optional_override(
                                      [](PxPrismaticJoint &joint, PxReal lowerLimit, PxReal upperLimit, PxReal stiffness,
                                         PxReal damping)
                                      {
                                          joint.setLimit(PxJointLinearLimitPair(lowerLimit, upperLimit, PxSpring(stiffness, damping)));
                                      })) // ✅
        .function("setPrismaticJointFlag", optional_override(
                                               [](PxPrismaticJoint &joint, PxReal flag, bool value)
                                               {
                                                   joint.setPrismaticJointFlag(PxPrismaticJointFlag::Enum(flag), value);
                                               }))                                                    // ✅
        .function("setProjectionLinearTolerance", &PxPrismaticJoint::setProjectionLinearTolerance)    // ✅
        .function("setProjectionAngularTolerance", &PxPrismaticJoint::setProjectionAngularTolerance); // ✅
    /* PhysXConfigurableJoint ✅ */
    class_<PxD6Joint, base<PxJoint>>("PxD6Joint")
        .function("setMotion", optional_override(
                                   [](PxD6Joint &joint, int axis, int type)
                                   {
                                       joint.setMotion(PxD6Axis::Enum(axis), PxD6Motion::Enum(type));
                                   })) // ✅
        .function("setHardDistanceLimit", optional_override(
                                              [](PxD6Joint &joint, PxTolerancesScale &scale, PxReal extent, PxReal contactDist)
                                              {
                                                  joint.setDistanceLimit(PxJointLinearLimit(scale, extent, contactDist));
                                              })) // ✅
        .function("setSoftDistanceLimit", optional_override(
                                              [](PxD6Joint &joint, PxReal extent, PxReal stiffness, PxReal damping)
                                              {
                                                  joint.setDistanceLimit(PxJointLinearLimit(extent, PxSpring(stiffness, damping)));
                                              })) // ✅
        .function("setHardLinearLimit", optional_override(
                                            [](PxD6Joint &joint, int axis, PxTolerancesScale &scale, PxReal lowerLimit, PxReal upperLimit,
                                               PxReal contactDist)
                                            {
                                                joint.setLinearLimit(PxD6Axis::Enum(axis),
                                                                     PxJointLinearLimitPair(scale, lowerLimit, upperLimit, contactDist));
                                            })) // ✅
        .function("setSoftLinearLimit", optional_override(
                                            [](PxD6Joint &joint, int axis, PxReal lowerLimit, PxReal upperLimit, PxReal stiffness,
                                               PxReal damping)
                                            {
                                                joint.setLinearLimit(PxD6Axis::Enum(axis), PxJointLinearLimitPair(lowerLimit, upperLimit,
                                                                                                                  PxSpring(stiffness,
                                                                                                                           damping)));
                                            })) // ✅
        .function("setHardTwistLimit", optional_override(
                                           [](PxD6Joint &joint, PxReal lowerLimit, PxReal upperLimit, PxReal contactDist)
                                           {
                                               joint.setTwistLimit(PxJointAngularLimitPair(lowerLimit, upperLimit, contactDist));
                                           })) // ✅
        .function("setSoftTwistLimit", optional_override(
                                           [](PxD6Joint &joint, PxReal lowerLimit, PxReal upperLimit, PxReal stiffness,
                                              PxReal damping)
                                           {
                                               joint.setTwistLimit(
                                                   PxJointAngularLimitPair(lowerLimit, upperLimit, PxSpring(stiffness, damping)));
                                           })) // ✅
        .function("setHardSwingLimit", optional_override(
                                           [](PxD6Joint &joint, PxReal lowerLimit, PxReal upperLimit, PxReal contactDist)
                                           {
                                               joint.setSwingLimit(PxJointLimitCone(lowerLimit, upperLimit, contactDist));
                                           })) // ✅
        .function("setSoftSwingLimit", optional_override(
                                           [](PxD6Joint &joint, PxReal lowerLimit, PxReal upperLimit, PxReal stiffness,
                                              PxReal damping)
                                           {
                                               joint.setSwingLimit(PxJointLimitCone(lowerLimit, upperLimit, PxSpring(stiffness, damping)));
                                           })) // ✅
        .function("setHardPyramidSwingLimit", optional_override(
                                                  [](PxD6Joint &joint, PxReal yLimitAngleMin, PxReal yLimitAngleMax, PxReal zLimitAngleMin,
                                                     PxReal zLimitAngleMax, PxReal contactDist)
                                                  {
                                                      joint.setPyramidSwingLimit(
                                                          PxJointLimitPyramid(yLimitAngleMin, yLimitAngleMax, zLimitAngleMin, zLimitAngleMax,
                                                                              contactDist));
                                                  })) // ✅
        .function("setSoftPyramidSwingLimit", optional_override(
                                                  [](PxD6Joint &joint, PxReal yLimitAngleMin, PxReal yLimitAngleMax, PxReal zLimitAngleMin,
                                                     PxReal zLimitAngleMax, PxReal stiffness,
                                                     PxReal damping)
                                                  {
                                                      joint.setPyramidSwingLimit(
                                                          PxJointLimitPyramid(yLimitAngleMin, yLimitAngleMax, zLimitAngleMin, zLimitAngleMax,
                                                                              PxSpring(stiffness, damping)));
                                                  })) // ✅
        .function("setDrive", optional_override(
                                  [](PxD6Joint &joint, int index, PxReal driveStiffness, PxReal driveDamping,
                                     PxReal driveForceLimit)
                                  {
                                      joint.setDrive(PxD6Drive::Enum(index),
                                                     PxD6JointDrive(driveStiffness, driveDamping, driveForceLimit));
                                  })) // ✅
        .function("setDrivePosition", optional_override(
                                          [](PxD6Joint &joint, const PxVec3 &pos, const PxQuat &rot)
                                          {
                                              joint.setDrivePosition(PxTransform(pos, rot));
                                          }))                                                  // ✅
        .function("setDriveVelocity", &PxD6Joint::setDriveVelocity)                            // ✅
        .function("setProjectionLinearTolerance", &PxD6Joint::setProjectionLinearTolerance)    // ✅
        .function("setProjectionAngularTolerance", &PxD6Joint::setProjectionAngularTolerance); // ✅

    class_<PxAllocatorCallback>("PxAllocatorCallback");
    class_<PxDefaultAllocator, base<PxAllocatorCallback>>("PxDefaultAllocator").constructor<>();
    class_<PxTolerancesScale>("PxTolerancesScale").constructor<>().property("speed", &PxTolerancesScale::speed);

    // Define PxsetCMassLocalPoseec3, PxQuat and PxTransform as value objects to allow sumerian Vector3
    // and Quaternion to be used directly without the need to free the memory
    value_object<PxVec3>("PxVec3")
        .field("x", &PxVec3::x)
        .field("y", &PxVec3::y)
        .field("z", &PxVec3::z);
    register_vector<PxVec3>("PxVec3Vector");
    value_object<PxQuat>("PxQuat")
        .field("x", &PxQuat::x)
        .field("y", &PxQuat::y)
        .field("z", &PxQuat::z)
        .field("w", &PxQuat::w);
    value_object<PxTransform>("PxTransform")
        .field("translation", &PxTransform::p)
        .field("rotation", &PxTransform::q);
    value_object<PxExtendedVec3>("PxExtendedVec3")
        .field("x", &PxExtendedVec3::x)
        .field("y", &PxExtendedVec3::y)
        .field("z", &PxExtendedVec3::z);

    enum_<PxIDENTITY>("PxIDENTITY")
        .value("PxIdentity", PxIDENTITY::PxIdentity);

    enum_<PxForceMode::Enum>("PxForceMode")
        .value("eFORCE", PxForceMode::Enum::eFORCE)
        .value("eIMPULSE", PxForceMode::Enum::eIMPULSE)
        .value("eVELOCITY_CHANGE", PxForceMode::Enum::eVELOCITY_CHANGE)
        .value("eACCELERATION", PxForceMode::Enum::eACCELERATION);

    class_<PxSceneDesc>("PxSceneDesc").constructor<PxTolerancesScale>().property("gravity", &PxSceneDesc::gravity);

    class_<PxFoundation>("PxFoundation").function("release", &PxFoundation::release);

    class_<PxSceneFlags>("PxSceneFlags");
    enum_<PxSceneFlag::Enum>("PxSceneFlag")
        .value("eENABLE_ACTIVE_ACTORS ", PxSceneFlag::Enum::eENABLE_ACTIVE_ACTORS)
        .value("eENABLE_CCD", PxSceneFlag::Enum::eENABLE_CCD)
        .value("eDISABLE_CCD_RESWEEP", PxSceneFlag::Enum::eDISABLE_CCD_RESWEEP)
        .value("eADAPTIVE_FORCE", PxSceneFlag::Enum::eADAPTIVE_FORCE)
        .value("eENABLE_PCM", PxSceneFlag::Enum::eENABLE_PCM)
        .value("eDISABLE_CONTACT_REPORT_BUFFER_RESIZE", PxSceneFlag::Enum::eDISABLE_CONTACT_REPORT_BUFFER_RESIZE)
        .value("eDISABLE_CONTACT_CACHE", PxSceneFlag::Enum::eDISABLE_CONTACT_CACHE)
        .value("eREQUIRE_RW_LOCK", PxSceneFlag::Enum::eREQUIRE_RW_LOCK)
        .value("eENABLE_STABILIZATION", PxSceneFlag::Enum::eENABLE_STABILIZATION)
        .value("eENABLE_AVERAGE_POINT", PxSceneFlag::Enum::eENABLE_AVERAGE_POINT)
        .value("eEXCLUDE_KINEMATICS_FROM_ACTIVE_ACTORS", PxSceneFlag::Enum::eEXCLUDE_KINEMATICS_FROM_ACTIVE_ACTORS)
        .value("eENABLE_ENHANCED_DETERMINISM", PxSceneFlag::Enum::eENABLE_ENHANCED_DETERMINISM)
        .value("eENABLE_FRICTION_EVERY_ITERATION", PxSceneFlag::Enum::eENABLE_FRICTION_EVERY_ITERATION);

    /** PhysXPhysicsManager ✅ */
    class_<PxScene>("PxScene")
        .function("release", &PxScene::release)
        .function("setGravity", &PxScene::setGravity) // ✅
        .function("getGravity", &PxScene::getGravity)
        .function("addActor", &PxScene::addActor, allow_raw_pointers())       // ✅
        .function("removeActor", &PxScene::removeActor, allow_raw_pointers()) // ✅
        .function("getScenePvdClient", &PxScene::getScenePvdClient, allow_raw_pointers())
        .function("getActors", &PxScene::getActors, allow_raw_pointers())
        .function("setVisualizationCullingBox", &PxScene::setVisualizationCullingBox)
        .function("collide", optional_override(
                                 [](PxScene &scene, PxReal elapsedTime)
                                 {
                                     scene.collide(elapsedTime);
                                 }))
        .function("fetchCollision", &PxScene::fetchCollision)
        .function("advance", optional_override(
                                 [](PxScene &scene)
                                 {
                                     scene.advance();
                                 }))
        .function("fetchResults", optional_override(
                                      [](PxScene &scene, bool block)
                                      {
                                          // fetchResults uses an out pointer
                                          // which embind can't represent
                                          // so let's override.
                                          bool fetched = scene.fetchResults(block);
                                          return fetched;
                                      })) // ✅
        .function("simulate", optional_override(
                                  [](PxScene &scene, PxReal elapsedTime, bool controlSimulation)
                                  {
                                      scene.simulate(elapsedTime, nullptr, nullptr, 0, controlSimulation);
                                  })) // ✅
        .function("raycast", &PxScene::raycast, allow_raw_pointers())
        .function("raycastAny", optional_override(
                                    [](const PxScene &scene, const PxVec3 &origin, const PxVec3 &unitDir, const PxReal distance)
                                    {
                                        PxSceneQueryHit hit;
                                        return PxSceneQueryExt::raycastAny(scene, origin, unitDir, distance, hit);
                                    }))
        .function("raycastSingle", optional_override(
                                       [](const PxScene &scene, const PxVec3 &origin, const PxVec3 &unitDir, const PxReal distance,
                                          PxRaycastHit &hit, const PxSceneQueryFilterData &filterData)
                                       {
                                           return PxSceneQueryExt::raycastSingle(scene, origin, unitDir, distance,
                                                                                 PxHitFlags(PxHitFlag::eDEFAULT), hit, PxSceneQueryFilterData(filterData.flags | PxQueryFlag::ePREFILTER),
                                                                                 ControllerQueryFilterCallbackInstance);
                                       })) // ✅
        .function("sweep", &PxScene::sweep, allow_raw_pointers())
        .function("sweepAny", optional_override(
                                  [](const PxScene &scene, const PxGeometry &geometry, const PxTransform &pose, const PxVec3 &unitDir,
                                     const PxReal distance, PxSceneQueryFlags queryFlags)
                                  {
                                      PxSweepHit hit;
                                      return PxSceneQueryExt::sweepAny(scene, geometry, pose, unitDir, distance, queryFlags, hit);
                                  }))
        .function("sweepSingle", optional_override(
                                     [](const PxScene &scene, const PxGeometry &geometry, const PxTransform &pose, const PxVec3 &unitDir,
                                        const PxReal distance, PxSceneQueryFlags outputFlags, PxSweepHit &hit)
                                     {
                                         return PxSceneQueryExt::sweepSingle(scene, geometry, pose, unitDir, distance, outputFlags, hit);
                                     }))
        .function("createControllerManager", optional_override([](PxScene &scene)
                                                               { return PxCreateControllerManager(scene); }),
                  allow_raw_pointers()); // ✅

    class_<PxLocationHit>("PxLocationHit")
        .property("position", &PxLocationHit::position)
        .property("normal", &PxLocationHit::normal)
        .property("distance", &PxLocationHit::distance);
    class_<PxRaycastHit, base<PxLocationHit>>("PxRaycastHit")
        .constructor<>()
        .function("getShape", optional_override([](PxRaycastHit &block)
                                                { return block.shape; }),
                  allow_raw_pointers())
        .function("getActor", optional_override([](PxRaycastHit &block)
                                                { return block.actor; }),
                  allow_raw_pointers());
    class_<PxRaycastCallback>("PxRaycastCallback")
        .property("block", &PxRaycastCallback::block)
        .property("hasBlock", &PxRaycastCallback::hasBlock)
        .allow_subclass<PxRaycastCallbackWrapper>("PxRaycastCallbackWrapper", constructor<PxRaycastHit *, PxU32>());
    class_<PxRaycastBuffer, base<PxRaycastCallback>>("PxRaycastBuffer").constructor<>();

    function("allocateRaycastHitBuffers", &allocateRaycastHitBuffers, allow_raw_pointers());

    class_<PxSweepHit, base<PxLocationHit>>("PxSweepHit").constructor<>().function("getShape", optional_override([](PxSweepHit &block)
                                                                                                                 { return block.shape; }),
                                                                                   allow_raw_pointers())
        .function("getActor", optional_override([](PxSweepHit &block)
                                                { return block.actor; }),
                  allow_raw_pointers());
    class_<PxSweepCallback>("PxSweepCallback")
        .property("block", &PxSweepCallback::block)
        .property("hasBlock", &PxSweepCallback::hasBlock)
        .allow_subclass<PxSweepCallbackWrapper>("PxSweepCallbackWrapper", constructor<PxSweepHit *, PxU32>());
    class_<PxSweepBuffer, base<PxSweepCallback>>("PxSweepBuffer").constructor<>();

    function("allocateSweepHitBuffers", &allocateSweepHitBuffers, allow_raw_pointers());

    class_<PxHitFlags>("PxHitFlags").constructor<int>();
    enum_<PxHitFlag::Enum>("PxHitFlag")
        .value("eDEFAULT", PxHitFlag::Enum::eDEFAULT)
        .value("eMESH_BOTH_SIDES", PxHitFlag::Enum::eMESH_BOTH_SIDES)
        .value("eMESH_MULTIPLE", PxHitFlag::Enum::eMESH_MULTIPLE);

    class_<PxQueryFilterData>("PxQueryFilterData").constructor<>().property("flags", &PxQueryFilterData::flags);
    class_<PxQueryFlags>("PxQueryFlags").constructor<int>();
    enum_<PxQueryFlag::Enum>("PxQueryFlag")
        .value("eANY_HIT", PxQueryFlag::Enum::eANY_HIT)
        .value("eDYNAMIC", PxQueryFlag::Enum::eDYNAMIC)
        .value("eSTATIC", PxQueryFlag::Enum::eSTATIC)
        .value("eNO_BLOCK", PxQueryFlag::Enum::eNO_BLOCK);
    enum_<PxQueryHitType::Enum>("PxQueryHitType")
        .value("eNONE", PxQueryHitType::Enum::eNONE)
        .value("eBLOCK", PxQueryHitType::Enum::eBLOCK)
        .value("eTOUCH", PxQueryHitType::Enum::eTOUCH);

    class_<PxQueryFilterCallback>("PxQueryFilterCallback")
        .allow_subclass<PxQueryFilterCallbackWrapper>("PxQueryFilterCallbackWrapper", constructor<>());
    class_<PxQueryCache>("PxQueryCache");

    enum_<PxCombineMode::Enum>("PxCombineMode")
        .value("eAVERAGE", PxCombineMode::Enum::eAVERAGE)
        .value("eMIN", PxCombineMode::Enum::eMIN)
        .value("eMAX", PxCombineMode::Enum::eMAX)
        .value("eMULTIPLY", PxCombineMode::Enum::eMULTIPLY);
    class_<PxMaterial>("PxMaterial")
        .function("release", &PxMaterial::release)
        .function("setDynamicFriction", &PxMaterial::setDynamicFriction)
        .function("setStaticFriction", &PxMaterial::setStaticFriction)
        .function("setRestitution", &PxMaterial::setRestitution)
        .function("setFrictionCombineMode", &PxMaterial::setFrictionCombineMode)
        .function("setRestitutionCombineMode", &PxMaterial::setRestitutionCombineMode);

    register_vector<PxMaterial *>("VectorPxMaterial");
    // setMaterials has 'PxMaterial**' as an input, which is not representable with embind
    // This is overrided to use std::vector<PxMaterial*>
    class_<PxShape>("PxShape")
        //.function("release", &PxShape::release)
        .function("release", optional_override([](PxShape &shape)
                                               {
                const char* str = shape.getName();
                if(str){
                    delete str;
                }
                delete ((ShapeUserData*)shape.userData);
                shape.release(); }))
        .function("getFlags", &PxShape::getFlags)
        .function("setFlag", &PxShape::setFlag)
        .function("setFlags", &PxShape::setFlags)
        .function("setLocalPose", &PxShape::setLocalPose)
        .function("getLocalPose", &PxShape::getLocalPose)
        .function("setGeometry", &PxShape::setGeometry)
        .function("getBoxGeometry", &PxShape::getBoxGeometry, allow_raw_pointers())
        .function("getSphereGeometry", &PxShape::getSphereGeometry, allow_raw_pointers())
        .function("getPlaneGeometry", &PxShape::getPlaneGeometry, allow_raw_pointers())
        .function("getCapsuleGeometry", &PxShape::getCapsuleGeometry, allow_raw_pointers())
        .function("setSimulationFilterData", &PxShape::setSimulationFilterData, allow_raw_pointers())
        .function("setQueryFilterData", &PxShape::setQueryFilterData)
        .function("getQueryFilterData", &PxShape::getQueryFilterData, allow_raw_pointers())
        .function("setMaterials", optional_override(
                                      [](PxShape &shape, std::vector<PxMaterial *> materials)
                                      {
                                          return shape.setMaterials(materials.data(), materials.size());
                                      }))
        .function("setName", optional_override([](PxShape &shape, const std::string name)
                                               {
                char* buffer = new char[name.length()];
                strcpy(buffer, name.c_str());
                shape.setName(buffer); }))
        .function("getName", optional_override([](PxShape &shape)
                                               {
               const char* str = shape.getName();
               return std::string(str); }))
        .function("setIsTrigger", optional_override([](PxShape &shape, bool isTrigger)
                                                    { ((ShapeUserData *)(shape.userData))->isTrigger = isTrigger; }))
        .function("setId", optional_override([](PxShape &shape, int id)
                                             { ((ShapeUserData *)(shape.userData))->id = id; }))
        .function("getId", optional_override([](PxShape &shape)
                                             { return ((ShapeUserData *)(shape.userData))->id; }));

    /** PhysXPhysics ✅ */
    class_<PxPhysics>("PxPhysics")
        .function("release", &PxPhysics::release)
        .function("getTolerancesScale", &PxPhysics::getTolerancesScale)
        .function("createScene", &PxPhysics::createScene, allow_raw_pointers())
        .function("createShape",
                  optional_override([](PxPhysics &physics, const PxGeometry &geometry, const PxMaterial &material, bool isExclusive, PxShapeFlags shapeFlags)
                                    {
                    PxShape* shape = physics.createShape(geometry, material, isExclusive, shapeFlags);
                    shape->userData = new ShapeUserData();
                    return shape; }),
                  allow_raw_pointers())
        .function("createMaterial", &PxPhysics::createMaterial, allow_raw_pointers())
        .function("createRigidDynamic", optional_override([](PxPhysics &physics, const PxTransform &pose)
                                                          {
            PxRigidDynamic* dynamic = physics.createRigidDynamic(pose);
            dynamic->userData = new ActorUserData();
            return dynamic; }),
                  allow_raw_pointers())
        .function("createRigidStatic", optional_override([](PxPhysics &physics, const PxTransform &pose)
                                                         {
            PxRigidStatic* sta = physics.createRigidStatic(pose);
            sta->userData = new ActorUserData();
            return sta; }),
                  allow_raw_pointers())
        .function("createFixedJoint", optional_override([](PxPhysics &physics, PxRigidActor *actor0, const PxVec3 &localPosition0, const PxQuat &localRotation0, PxRigidActor *actor1, const PxVec3 &localPosition1, const PxQuat &localRotation1)
                                                        { return PxFixedJointCreate(physics, actor0, PxTransform(localPosition0, localRotation0),
                                                                                    actor1, PxTransform(localPosition1, localRotation1)); }),
                  allow_raw_pointers()) // ✅
        .function("createRevoluteJoint", optional_override([](PxPhysics &physics, PxRigidActor *actor0, const PxVec3 &localPosition0, const PxQuat &localRotation0, PxRigidActor *actor1, const PxVec3 &localPosition1, const PxQuat &localRotation1)
                                                           { return PxRevoluteJointCreate(physics, actor0, PxTransform(localPosition0, localRotation0),
                                                                                          actor1, PxTransform(localPosition1, localRotation1)); }),
                  allow_raw_pointers()) // ✅
        .function("createSphericalJoint", optional_override([](PxPhysics &physics, PxRigidActor *actor0, const PxVec3 &localPosition0, const PxQuat &localRotation0, PxRigidActor *actor1, const PxVec3 &localPosition1, const PxQuat &localRotation1)
                                                            { return PxSphericalJointCreate(physics, actor0, PxTransform(localPosition0, localRotation0),
                                                                                            actor1, PxTransform(localPosition1, localRotation1)); }),
                  allow_raw_pointers()) // ✅
        .function("createDistanceJoint", optional_override([](PxPhysics &physics, PxRigidActor *actor0, const PxVec3 &localPosition0, const PxQuat &localRotation0, PxRigidActor *actor1, const PxVec3 &localPosition1, const PxQuat &localRotation1)
                                                           { return PxDistanceJointCreate(physics, actor0, PxTransform(localPosition0, localRotation0),
                                                                                          actor1, PxTransform(localPosition1, localRotation1)); }),
                  allow_raw_pointers()) // ✅
        .function("createPrismaticJoint", optional_override([](PxPhysics &physics, PxRigidActor *actor0, const PxVec3 &localPosition0, const PxQuat &localRotation0, PxRigidActor *actor1, const PxVec3 &localPosition1, const PxQuat &localRotation1)
                                                            { return PxPrismaticJointCreate(physics, actor0, PxTransform(localPosition0, localRotation0),
                                                                                            actor1, PxTransform(localPosition1, localRotation1)); }),
                  allow_raw_pointers()) // ✅
        .function("createD6Joint", optional_override([](PxPhysics &physics, PxRigidActor *actor0, const PxVec3 &localPosition0, const PxQuat &localRotation0, PxRigidActor *actor1, const PxVec3 &localPosition1, const PxQuat &localRotation1)
                                                     { return PxD6JointCreate(physics, actor0, PxTransform(localPosition0, localRotation0),
                                                                              actor1, PxTransform(localPosition1, localRotation1)); }),
                  allow_raw_pointers()); // ✅

    class_<PxShapeFlags>("PxShapeFlags").constructor<int>().function("isSet", &PxShapeFlags::isSet);
    enum_<PxShapeFlag::Enum>("PxShapeFlag")
        .value("eSIMULATION_SHAPE", PxShapeFlag::Enum::eSIMULATION_SHAPE)
        .value("eSCENE_QUERY_SHAPE", PxShapeFlag::Enum::eSCENE_QUERY_SHAPE)
        .value("eTRIGGER_SHAPE", PxShapeFlag::Enum::eTRIGGER_SHAPE)
        .value("eVISUALIZATION", PxShapeFlag::Enum::eVISUALIZATION);

    enum_<PxActorFlag::Enum>("PxActorFlag")
        .value("eDISABLE_GRAVITY", PxActorFlag::Enum::eDISABLE_GRAVITY)
        .value("eDISABLE_SIMULATION", PxActorFlag::Enum::eDISABLE_SIMULATION);

    class_<PxErrorCallback>("PxErrorCallback");
    class_<PxDefaultErrorCallback, base<PxErrorCallback>>("PxDefaultErrorCallback").constructor<>();

    class_<PxCooking>("PxCooking")
        .function("release", &PxCooking::release)
        .function("createConvexMesh", optional_override([](PxCooking &cooking, std::vector<PxVec3> &vertices, PxPhysics &physics)
                                                        { return createConvexMesh(vertices, cooking, physics); }),
                  allow_raw_pointers())
        .function("createConvexMeshFromBuffer", optional_override([](PxCooking &cooking, int vertices, PxU32 vertCount, PxPhysics &physics)
                                                                  { return createConvexMeshFromBuffer(vertices, vertCount, cooking, physics); }),
                  allow_raw_pointers())
        .function("createTriMesh", optional_override([](PxCooking &cooking, int vertices, PxU32 vertCount, int indices, PxU32 indexCount, bool isU16, PxPhysics &physics)
                                                     { return createTriMesh(vertices, vertCount, indices, indexCount, isU16, cooking, physics); }),
                  allow_raw_pointers());

    class_<PxMeshPreprocessingFlags>("PxMeshPreprocessingFlags").constructor<int>();
    enum_<PxMeshPreprocessingFlag::Enum>("PxMeshPreprocessingFlag")
        .value("eWELD_VERTICES", PxMeshPreprocessingFlag::Enum::eWELD_VERTICES);

    class_<PxCookingParams>("PxCookingParams").constructor<PxTolerancesScale>().property("planeTolerance", &PxCookingParams::planeTolerance).property("meshPreprocessParams", &PxCookingParams::meshPreprocessParams).property("meshWeldTolerance", &PxCookingParams::meshWeldTolerance);

    class_<PxCpuDispatcher>("PxCpuDispatcher");
    class_<PxBVHStructure>("PxBVHStructure");
    class_<PxBaseTask>("PxBaseTask");
    class_<PxDefaultCpuDispatcher, base<PxCpuDispatcher>>("PxDefaultCpuDispatcher");

    class_<PxFilterData>("PxFilterData")
        .constructor<PxU32, PxU32, PxU32, PxU32>()
        .property("word0", &PxFilterData::word0)
        .property("word1", &PxFilterData::word1)
        .property("word2", &PxFilterData::word2)
        .property("word3", &PxFilterData::word3);
    class_<PxPairFlags>("PxPairFlags");
    class_<PxFilterFlags>("PxFilterFlags");
    enum_<PxPairFlag::Enum>("PxPairFlag");
    enum_<PxFilterFlag::Enum>("PxFilterFlag");

    /** PhysXCollider ✅ */
    class_<PxActor>("PxActor")
        .function("setActorFlag", &PxActor::setActorFlag)
        .function("setName", optional_override([](PxActor &actor, const std::string name)
                                               {
                char* buffer = new char[name.length()];
                strcpy(buffer, name.c_str());
                actor.setName(buffer); }))
        .function("getName", optional_override([](PxActor &actor)
                                               {
               const char* str = actor.getName();
               return std::string(str); }))
        .function("release", optional_override([](PxActor &actor)
                                               {
                const char* str = actor.getName();
                if(str){
                    delete str;
                }
                delete ((ActorUserData*)actor.userData);
                actor.release(); }))
        .function("setId", optional_override([](PxActor &actor, int id)
                                             {
                if(!actor.userData){
                    actor.userData = new ActorUserData();
                }
                ((ActorUserData*)(actor.userData))->id = id; }))
        .function("getId", optional_override([](PxActor &actor)
                                             {
                if(!actor.userData){
                    actor.userData = new ActorUserData();
                }
                return ((ActorUserData*)(actor.userData))->id; }));

    class_<PxRigidActor, base<PxActor>>("PxRigidActor")
        .function("attachShape", &PxRigidActor::attachShape)                           // ✅
        .function("detachShape", &PxRigidActor::detachShape)                           // ✅
        .function("getGlobalPose", &PxRigidActor::getGlobalPose, allow_raw_pointers()) // ✅
        .function("copyGlobalPose", optional_override([](PxRigidActor &actor, int pointer)
                                                      { 
                    PxTransform trans = actor.getGlobalPose();
                    *((PxTransform*)(pointer)) = trans; }),
                  allow_raw_pointers())
        .function("setGlobalPose", &PxRigidActor::setGlobalPose, allow_raw_pointers()) // ✅
        .function("getShape", optional_override([](PxRigidActor &actor)
                                                {
                        PxShape *shape;
                        actor.getShapes(&shape, 1);
                        return shape; }),
                  allow_raw_pointers());

    // .function("setQueryFilterData", optional_override(
    //                                     [](PxRigidActor &actor, PxFilterData &data)
    //                                     {
    //                                         PxShape *shape;
    //                                         actor.getShapes(&shape, 1);
    //                                         shape->setQueryFilterData(data);
    //                                     }))
    // .function("getQueryFilterData", optional_override(
    //                                     [](PxRigidActor &actor, PxFilterData &data)
    //                                     {
    //                                         PxShape *shape;
    //                                         actor.getShapes(&shape, 1);
    //                                         return shape->getQueryFilterData();
    //                                     }));
    /** PhysXStaticCollider ✅ */
    class_<PxRigidStatic, base<PxRigidActor>>("PxRigidStatic");
    /** PhysXDynamicCollider ✅ */
    class_<PxRigidBody, base<PxRigidActor>>("PxRigidBody")
        .function("setAngularDamping", &PxRigidBody::setAngularDamping) // ✅
        .function("getAngularDamping", &PxRigidBody::getAngularDamping)
        .function("setLinearDamping", &PxRigidBody::setLinearDamping) // ✅
        .function("getLinearDamping", &PxRigidBody::getLinearDamping)
        .function("setAngularVelocity", &PxRigidBody::setAngularVelocity) // ✅
        .function("getAngularVelocity", &PxRigidBody::getAngularVelocity)
        .function("setLinearVelocity", &PxRigidBody::setLinearVelocity) // ✅
        .function("getLinearVelocity", &PxRigidBody::getLinearVelocity)
        .function("setMaxAngularVelocity", &PxRigidBody::setMaxAngularVelocity) // ✅
        .function("getMaxAngularVelocity", &PxRigidBody::getMaxAngularVelocity)
        .function("setMaxLinearVelocity", &PxRigidBody::setMaxLinearVelocity) // ✅
        .function("getMaxLinearVelocity", &PxRigidBody::getMaxLinearVelocity)
        .function("setMaxDepenetrationVelocity", &PxRigidBody::setMaxDepenetrationVelocity) // ✅
        .function("getMaxDepenetrationVelocity", &PxRigidBody::getMaxDepenetrationVelocity)
        .function("setMass", &PxRigidBody::setMass) // ✅
        .function("getMass", &PxRigidBody::getMass)
        .function("setCMassLocalPose", optional_override(
                                           [](PxRigidBody &body, const PxVec3 &pos)
                                           {
                                               return body.setCMassLocalPose(PxTransform(pos, PxQuat(PxIDENTITY::PxIdentity)));
                                           }))                                          // ✅
        .function("setMassSpaceInertiaTensor", &PxRigidBody::setMassSpaceInertiaTensor) // ✅
        .function("addTorque", optional_override(
                                   [](PxRigidBody &body, const PxVec3 &torque)
                                   {
                                       body.addTorque(torque, PxForceMode::eFORCE, true);
                                   })) // ✅
        .function("addForce", optional_override(
                                  [](PxRigidBody &body, const PxVec3 &force)
                                  {
                                      body.addForce(force, PxForceMode::eFORCE, true);
                                  })) // ✅
        .function("addForceAtPos", optional_override(
                                       [](PxRigidBody &body, const PxVec3 &force, const PxVec3 &pos)
                                       {
                                           PxRigidBodyExt::addForceAtPos(body, force, pos, PxForceMode::eFORCE, true);
                                       }))
        .function("addForceAtLocalPos", optional_override(
                                            [](PxRigidBody &body, const PxVec3 &force, const PxVec3 &pos)
                                            {
                                                PxRigidBodyExt::addForceAtLocalPos(body, force, pos, PxForceMode::eFORCE, true);
                                            }))
        .function("addLocalForceAtLocalPos", optional_override(
                                                 [](PxRigidBody &body, const PxVec3 &force, const PxVec3 &pos)
                                                 {
                                                     PxRigidBodyExt::addLocalForceAtLocalPos(body, force, pos, PxForceMode::eFORCE, true);
                                                 }))
        .function("addImpulseAtPos", optional_override(
                                         [](PxRigidBody &body, const PxVec3 &impulse, const PxVec3 &pos)
                                         {
                                             PxRigidBodyExt::addForceAtPos(body, impulse, pos, PxForceMode::eIMPULSE, true);
                                         }))
        .function("addImpulseAtLocalPos", optional_override(
                                              [](PxRigidBody &body, const PxVec3 &impulse, const PxVec3 &pos)
                                              {
                                                  PxRigidBodyExt::addForceAtLocalPos(body, impulse, pos, PxForceMode::eIMPULSE, true);
                                              }))
        .function("addLocalImpulseAtLocalPos", optional_override(
                                                   [](PxRigidBody &body, const PxVec3 &impulse, const PxVec3 &pos)
                                                   {
                                                       PxRigidBodyExt::addLocalForceAtLocalPos(body, impulse, pos, PxForceMode::eIMPULSE, true);
                                                   }))
        .function("getVelocityAtPos", optional_override(
                                          [](PxRigidBody &body, const PxVec3 &pos)
                                          {
                                              return PxRigidBodyExt::getVelocityAtPos(body, pos);
                                          }))
        .function("getLocalVelocityAtLocalPos", optional_override(
                                                    [](PxRigidBody &body, const PxVec3 &pos)
                                                    {
                                                        return PxRigidBodyExt::getLocalVelocityAtLocalPos(body, pos);
                                                    }))
        .function("setRigidBodyFlag", &PxRigidBody::setRigidBodyFlag)
        .function("getRigidBodyFlags", optional_override(
                                           [](PxRigidBody &body)
                                           {
                                               return (bool)(body.getRigidBodyFlags() & PxRigidBodyFlag::eKINEMATIC);
                                           })) // ✅
        .function("setMassAndUpdateInertia", optional_override(
                                                 [](PxRigidBody &body, PxReal mass)
                                                 {
                                                     return PxRigidBodyExt::setMassAndUpdateInertia(body, mass, nullptr, false);
                                                 }));
    /** PhysXDynamicCollider ✅ */
    class_<PxRigidDynamic, base<PxRigidBody>>("PxRigidDynamic")
        .function("setSleepThreshold", &PxRigidDynamic::setSleepThreshold) // ✅
        .function("getSleepThreshold", &PxRigidDynamic::getSleepThreshold)
        .function("setSolverIterationCounts", &PxRigidDynamic::setSolverIterationCounts) // ✅
        .function("wakeUp", &PxRigidDynamic::wakeUp)                                     // ✅
        .function("setWakeCounter", &PxRigidDynamic::setWakeCounter)
        .function("isSleeping", &PxRigidDynamic::isSleeping)
        .function("putToSleep", &PxRigidDynamic::putToSleep) // ✅
        .function("getWakeCounter", &PxRigidDynamic::getWakeCounter)
        .function("setKinematicTarget", optional_override(
                                            [](PxRigidDynamic &body, const PxVec3 &pos, const PxQuat &rot)
                                            {
                                                return body.setKinematicTarget(PxTransform(pos, rot));
                                            })) // ✅
        .function("setRigidDynamicLockFlag", &PxRigidDynamic::setRigidDynamicLockFlag)
        .function("setRigidDynamicLockFlags", optional_override(
                                                  [](PxRigidDynamic &body, int flags)
                                                  {
                                                      return body.setRigidDynamicLockFlags(PxRigidDynamicLockFlags(flags));
                                                  })); // ✅
    class_<PxRigidBodyFlags>("PxRigidBodyFlags");
    enum_<PxRigidBodyFlag::Enum>("PxRigidBodyFlag")
        .value("eKINEMATIC", PxRigidBodyFlag::Enum::eKINEMATIC)
        .value("eUSE_KINEMATIC_TARGET_FOR_SCENE_QUERIES",
               PxRigidBodyFlag::Enum::eUSE_KINEMATIC_TARGET_FOR_SCENE_QUERIES)
        .value("eENABLE_CCD", PxRigidBodyFlag::Enum::eENABLE_CCD)
        .value("eENABLE_CCD_FRICTION", PxRigidBodyFlag::Enum::eENABLE_CCD_FRICTION)
        .value("eENABLE_POSE_INTEGRATION_PREVIEW", PxRigidBodyFlag::Enum::eENABLE_POSE_INTEGRATION_PREVIEW)
        .value("eENABLE_SPECULATIVE_CCD", PxRigidBodyFlag::Enum::eENABLE_SPECULATIVE_CCD)
        .value("eENABLE_CCD_MAX_CONTACT_IMPULSE", PxRigidBodyFlag::Enum::eENABLE_CCD_MAX_CONTACT_IMPULSE)
        .value("eRETAIN_ACCELERATIONS", PxRigidBodyFlag::Enum::eRETAIN_ACCELERATIONS);

    /** PhysXColliderShape ✅ */
    class_<PxGeometry>("PxGeometry");
    /** PhysXBoxColliderShape ✅ */
    class_<PxBoxGeometry, base<PxGeometry>>("PxBoxGeometry")
        .constructor<>()
        .constructor<float, float, float>()
        .function("isValid", &PxBoxGeometry::isValid)
        .property("halfExtents", &PxBoxGeometry::halfExtents); // ✅
    /** PhysXSphereColliderShape ✅ */
    class_<PxSphereGeometry, base<PxGeometry>>("PxSphereGeometry")
        .constructor<>()
        .constructor<float>()
        .property("radius", &PxSphereGeometry::radius) // ✅
        .function("isValid", &PxSphereGeometry::isValid);
    /** PhysXCapsuleColliderShape ✅ */
    class_<PxCapsuleGeometry, base<PxGeometry>>("PxCapsuleGeometry")
        .constructor<float, float>()
        .property("radius", &PxCapsuleGeometry::radius)         // ✅
        .property("halfHeight", &PxCapsuleGeometry::halfHeight) // ✅
        .function("isValid", &PxCapsuleGeometry::isValid);
    /** PhysXCapsuleColliderShape ✅ */
    class_<PxPlaneGeometry, base<PxGeometry>>("PxPlaneGeometry").constructor<>();

    class_<PxTriangleMesh>("")
        // add by hzy
        .function("getCenter", optional_override([](PxTriangleMesh &mesh)
                                                 {
                        auto bound = mesh.getLocalBounds();
                        return bound.getCenter(); }))
        .function("release", &PxTriangleMesh::release);
    class_<PxTriangleMeshGeometry, base<PxGeometry>>("PxTriangleMeshGeometry")
        .constructor<PxTriangleMesh *, const PxMeshScale &, PxMeshGeometryFlags>()
        .property("scale", &PxTriangleMeshGeometry::scale);

    class_<PxMeshGeometryFlags>("PxMeshGeometryFlags").constructor<int>();
    enum_<PxMeshGeometryFlag::Enum>("PxMeshGeometryFlag")
        .value("eDOUBLE_SIDED", PxMeshGeometryFlag::Enum::eDOUBLE_SIDED);

    class_<PxConvexMesh>("PxConvexMesh")
        .function("getMassInformation", optional_override(
                                            [](PxConvexMesh &mesh)
                                            {
                                                PxReal mass;
                                                PxMat33 localInertia;
                                                PxVec3 cmass;
                                                mesh.getMassInformation(mass, localInertia, cmass);
                                                return cmass;
                                            }))
        .function("release", &PxConvexMesh::release);

    class_<PxConvexMeshGeometry, base<PxGeometry>>(
        "PxConvexMeshGeometry")
        .constructor<PxConvexMesh *, const PxMeshScale &, PxConvexMeshGeometryFlags>()
        .property("scale", &PxConvexMeshGeometry::scale);

    class_<PxMeshScale>("PxMeshScale").constructor<const PxVec3 &, const PxQuat &>();

    class_<PxConvexMeshGeometryFlags>("PxConvexMeshGeometryFlags").constructor<int>();
    enum_<PxConvexMeshGeometryFlag::Enum>("PxConvexMeshGeometryFlag")
        .value("eTIGHT_BOUNDS", PxConvexMeshGeometryFlag::Enum::eTIGHT_BOUNDS);

    class_<PxPlane>("PxPlane").constructor<float, float, float, float>();

    /** PhysXCharacterControllerManager ✅ */
    class_<PxControllerManager>("PxControllerManager")
        .function("release", &PxControllerManager::release)
        .function("purgeControllers", &PxControllerManager::purgeControllers)                       // ✅
        .function("createController", &PxControllerManager::createController, allow_raw_pointers()) // ✅

        .function("createCapsuleController", optional_override([](PxControllerManager &manager, const PxControllerDesc &desc)
                                                               {
            PxController* controller = manager.createController(desc);
            return (PxCapsuleController*)(controller); }),
                  allow_raw_pointers()) // ✅

        .function("computeInteractions", &PxControllerManager::computeInteractions, allow_raw_pointers()) // ✅
        .function("setTessellation", &PxControllerManager::setTessellation)                               // ✅
        .function("setOverlapRecoveryModule", &PxControllerManager::setOverlapRecoveryModule)             // ✅
        .function("setPreciseSweeps", &PxControllerManager::setPreciseSweeps)                             // ✅
        .function("setPreventVerticalSlidingAgainstCeiling",
                  &PxControllerManager::setPreventVerticalSlidingAgainstCeiling) // ✅
        .function("shiftOrigin", &PxControllerManager::shiftOrigin);             // ✅

    // add by hzy
    class_<PxUserControllerHitReportPublic>("PxUserControllerHitReportPublic")
        .allow_subclass<PxUserControllerHitReportWrapper>("PxUserControllerHitReportWrapper", constructor<>());

    class_<DefaultUserControllerHitReport, base<PxUserControllerHitReportPublic>>("DefaultUserControllerHitReport")
        .constructor<>();

    class_<PxControllerBehaviorCallbackPublic>("PxControllerBehaviorCallbackPublic");

    class_<DefaultControllerBehaviorCallback, base<PxControllerBehaviorCallbackPublic>>("DefaultControllerBehaviorCallback")
        .constructor<>();

    /** PhysXCharacterControllerDesc ✅ */
    class_<PxControllerDesc>("PxControllerDesc")
        // add by hzy
        .function("setReportCallback", optional_override([](PxControllerDesc &desc, PxUserControllerHitReportPublic *callback)
                                                         { desc.reportCallback = callback; }),
                  allow_raw_pointers())
        .function("setBehaviorCallback", optional_override([](PxControllerDesc &desc, PxControllerBehaviorCallbackPublic *callback)
                                                           { desc.behaviorCallback = callback; }),
                  allow_raw_pointers())
        .function("isValid", &PxControllerDesc::isValid)
        .function("getType", &PxControllerDesc::getType)                         // ✅
        .property("position", &PxControllerDesc::position)                       // ✅
        .property("upDirection", &PxControllerDesc::upDirection)                 // ✅
        .property("slopeLimit", &PxControllerDesc::slopeLimit)                   // ✅
        .property("invisibleWallHeight", &PxControllerDesc::invisibleWallHeight) // ✅
        .property("maxJumpHeight", &PxControllerDesc::maxJumpHeight)             // ✅
        .property("contactOffset", &PxControllerDesc::contactOffset)             // ✅
        .property("stepOffset", &PxControllerDesc::stepOffset)                   // ✅
        .property("density", &PxControllerDesc::density)                         // ✅
        .property("scaleCoeff", &PxControllerDesc::scaleCoeff)                   // ✅
        .property("volumeGrowth", &PxControllerDesc::volumeGrowth)               // ✅
        .function("setNonWalkableMode", optional_override(
                                            [](PxControllerDesc &desc, int mode)
                                            {
                                                return desc.nonWalkableMode = PxControllerNonWalkableMode::Enum(mode);
                                            })) // ✅
        .function("setMaterial", optional_override([](PxControllerDesc &desc, PxMaterial *material)
                                                   { return desc.material = material; }),
                  allow_raw_pointers())                                                     // ✅
        .property("registerDeletionListener", &PxControllerDesc::registerDeletionListener); // ✅

    /** PhysXCapsuleCharacterControllerDesc ✅ */
    class_<PxCapsuleControllerDesc, base<PxControllerDesc>>("PxCapsuleControllerDesc")
        .constructor<>()
        .function("isValid", &PxCapsuleControllerDesc::isValid)
        .function("setToDefault", &PxCapsuleControllerDesc::setToDefault) // ✅
        .property("radius", &PxCapsuleControllerDesc::radius)             // ✅
        .property("height", &PxCapsuleControllerDesc::height)             // ✅
        .function("setClimbingMode", optional_override(
                                         [](PxCapsuleControllerDesc &desc, int mode)
                                         {
                                             desc.climbingMode = PxCapsuleClimbingMode::Enum(mode);
                                         })); // ✅
    /** PhysXCharacterController ✅ */
    class_<PxController>("PxController")
        // .function("release", &PxController::release)
        .function("isSetControllerCollisionFlag", optional_override(
                                                      [](PxController &controller, int flags, int flag)
                                                      {
                                                          return PxControllerCollisionFlags(flags).isSet(PxControllerCollisionFlag::Enum(flag));
                                                      })) // ✅
        .function("move", optional_override(
                              [](PxController &controller, const PxVec3 &disp, PxF32 minDist, PxF32 elapsedTime)
                              {
                                  return controller.move(disp, minDist, elapsedTime, PxControllerFilters(NULL, ControllerQueryFilterCallbackInstance));
                              }))                            // ✅
        .function("setPosition", &PxController::setPosition) // ✅
        .function("getPosition", &PxController::getPosition)
        .function("setFootPosition", &PxController::setFootPosition) // ✅
        .function("setStepOffset", &PxController::setStepOffset)     // ✅
        .function("setNonWalkableMode", optional_override(
                                            [](PxController &controller, int mode)
                                            {
                                                return controller.setNonWalkableMode(PxControllerNonWalkableMode::Enum(mode));
                                            }))                        // ✅
        .function("setContactOffset", &PxController::setContactOffset) // ✅
        .function("setUpDirection", &PxController::setUpDirection)     // ✅
        .function("setSlopeLimit", &PxController::setSlopeLimit)       // ✅
        .function("invalidateCache", &PxController::invalidateCache)   // ✅
        .function("resize", &PxController::resize)                     // ✅
        //重复了
        //.function("invalidateCache", &PxController::invalidateCache) // ✅
        .function("setQueryFilterData", optional_override(
                                            [](PxController &ctrl, PxFilterData &data)
                                            {
                                                PxRigidDynamic *actor = ctrl.getActor();
                                                PxShape *shape;
                                                actor->getShapes(&shape, 1);
                                                shape->setQueryFilterData(data);
                                            })) // ✅
        .function("getQueryFilterData", optional_override(
                                            [](PxController &ctrl, PxFilterData &data)
                                            {
                                                PxRigidDynamic *actor = ctrl.getActor();
                                                PxShape *shape;
                                                actor->getShapes(&shape, 1);
                                                return shape->getQueryFilterData();
                                            }))
        .function("getActor", &PxController::getActor, allow_raw_pointers());
    /** PhysXCapsuleCharacterController ✅ */
    class_<PxCapsuleController, base<PxController>>("PxCapsuleController")
        .function("release", &PxCapsuleController::release)
        .function("setRadius", &PxCapsuleController::setRadius) // ✅
        .function("setHeight", &PxCapsuleController::setHeight) // ✅
        .function("setClimbingMode", optional_override(
                                         [](PxCapsuleController &controller, int mode)
                                         {
                                             controller.setClimbingMode(PxCapsuleClimbingMode::Enum(mode));
                                         })); // ✅

    class_<PxControllerCollisionFlags>("PxControllerCollisionFlags").constructor<int>().function("isSet", &PxControllerCollisionFlags::isSet);
    enum_<PxControllerCollisionFlag::Enum>("PxControllerCollisionFlag")
        .value("eCOLLISION_SIDES", PxControllerCollisionFlag::Enum::eCOLLISION_SIDES)
        .value("eCOLLISION_UP", PxControllerCollisionFlag::Enum::eCOLLISION_UP)
        .value("eCOLLISION_DOWN", PxControllerCollisionFlag::Enum::eCOLLISION_DOWN);
}

namespace emscripten
{
    namespace internal
    {
        template <>
        void raw_destructor<PxPvd>(PxPvd *)
        { /* do nothing */
        }

#if PX_DEBUG || PX_PROFILE || PX_CHECKED || PX_SUPPORT_PVD
        template <>
        void raw_destructor<PxPvdTransport>(PxPvdTransport *)
        { /* do nothing */
        }

        template <>
        void raw_destructor<PxPvdSceneClient>(PxPvdSceneClient *)
        { /* do nothing */
        }

#endif

        // Physx uses private destructors all over the place for its own reference counting
        // embind doesn't deal with this well, so we have to override the destructors to keep them private
        // in the bindings
        // See: https://github.com/emscripten-core/emscripten/issues/5587
        template <>
        void raw_destructor<PxFoundation>(PxFoundation *)
        { /* do nothing */
        }

        template <>
        void raw_destructor<PxMaterial>(PxMaterial *)
        { /* do nothing */
        }

        template <>
        void raw_destructor<PxScene>(PxScene *)
        { /* do nothing */
        }

        template <>
        void raw_destructor<PxRigidDynamic>(PxRigidDynamic *)
        { /* do nothing */
        }

        template <>
        void raw_destructor<PxRigidBody>(PxRigidBody *)
        { /* do nothing */
        }

        template <>
        void raw_destructor<PxRigidActor>(PxRigidActor *)
        { /* do nothing */
        }

        template <>
        void raw_destructor<PxActor>(PxActor *)
        { /* do nothing */
        }

        template <>
        void raw_destructor<PxShape>(PxShape *)
        { /* do nothing */
        }

        template <>
        void raw_destructor<PxBVHStructure>(PxBVHStructure *)
        { /* do nothing */
        }

        template <>
        void raw_destructor<PxRigidStatic>(PxRigidStatic *)
        { /* do nothing */
        }

        template <>
        void raw_destructor<PxJoint>(PxJoint *)
        { /* do nothing */
        }

        template <>
        void raw_destructor<PxCooking>(PxCooking *)
        { /* do nothing */
        }

        template <>
        void raw_destructor<PxConvexMesh>(PxConvexMesh *)
        { /* do nothing */
        }

        template <>
        void raw_destructor<PxTriangleMesh>(PxTriangleMesh *)
        { /* do nothing */
        }

        template <>
        void raw_destructor<PxController>(PxController *)
        { /* do nothing */
        }

        template <>
        void raw_destructor<PxCapsuleController>(PxCapsuleController *)
        { /* do nothing */
        }

        template <>
        void raw_destructor<PxControllerDesc>(PxControllerDesc *)
        { /* do nothing */
        }

        template <>
        void raw_destructor<PxControllerManager>(PxControllerManager *)
        { /* do nothing */
        }
    } // namespace internal
} // namespace emscripten
