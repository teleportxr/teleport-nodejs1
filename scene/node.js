'use strict';
const core= require('../protocol/core.js');
class Pose
{
    constructor()
    {
		this.orientation = { x:0.0, y:0.0, z:0.0, w:1.0 };
		this.position = { x:0.0, y:0.0, z:0.0 };
		this.scale = { x:1.0, y:1.0, z:1.0 };
	}
    static sizeof(){
        return 4*4+(3*4)+(3*4);
    }
    size(){
        return Pose.sizeof();
    }
	encodeIntoDataView(dataView,byteOffset) {
		dataView.setFloat32(byteOffset+0,this.position.x,core.endian);
		dataView.setFloat32(byteOffset+4,this.position.y,core.endian);
		dataView.setFloat32(byteOffset+8,this.position.z,core.endian);
		dataView.setFloat32(byteOffset+12,this.orientation.x,core.endian);
		dataView.setFloat32(byteOffset+16,this.orientation.y,core.endian);
		dataView.setFloat32(byteOffset+20,this.orientation.z,core.endian);
		dataView.setFloat32(byteOffset+24,this.orientation.w,core.endian);
		dataView.setFloat32(byteOffset+28,this.scale.x,core.endian);
		dataView.setFloat32(byteOffset+32,this.scale.y,core.endian);
		dataView.setFloat32(byteOffset+36,this.scale.z,core.endian);
		return byteOffset+40;
	}
	encodeToUint8Array(){
		var array=new Uint8Array(this.size());
		var dataView=new DataView(array.buffer);
		this.encodeIntoDataView(dataView);
		return array;
	}
};
class PoseDynamic
{
	constructor(){
		this.pose=new Pose();
		this.velocity={x:0.0, y:0.0, z:0.0 };
		this.angularVelocity={x:0.0, y:0.0, z:0.0 };
	}
    static sizeof(){
        return Pose.sizeof()+(3*4)+(3*4);
    }
    size(){
        return PoseDynamic.sizeof();
    }
	encodeIntoDataView(dataView,byteOffset) {
		dataView.setFloat32(byteOffset+0,this.position.x,core.endian);
		dataView.setFloat32(byteOffset+4,this.position.y,core.endian);
		dataView.setFloat32(byteOffset+8,this.position.z,core.endian);
		dataView.setFloat32(byteOffset+12,this.orientation.x,core.endian);
		dataView.setFloat32(byteOffset+16,this.orientation.y,core.endian);
		dataView.setFloat32(byteOffset+20,this.orientation.z,core.endian);
		dataView.setFloat32(byteOffset+24,this.orientation.w,core.endian);
		dataView.setFloat32(byteOffset+28,this.scale.x,core.endian);
		dataView.setFloat32(byteOffset+32,this.scale.y,core.endian);
		dataView.setFloat32(byteOffset+36,this.scale.z,core.endian);

		dataView.setFloat32(byteOffset+40,this.velocity.x,core.endian);
		dataView.setFloat32(byteOffset+44,this.velocity.y,core.endian);
		dataView.setFloat32(byteOffset+48,this.velocity.z,core.endian);
		dataView.setFloat32(byteOffset+52,this.angularVelocity.x,core.endian);
		dataView.setFloat32(byteOffset+56,this.angularVelocity.y,core.endian);
		dataView.setFloat32(byteOffset+60,this.angularVelocity.z,core.endian);
		return byteOffset+64;
	}
};

//! The payload type, or how to interpret the server's message.
const NodeDataType =
{									
	Invalid:0,		
	None:1,
	Mesh:2,
	Light:3,
	TextCanvas:4,
	SubScene:5,
	Skeleton:6,
	Link:7,
	Script:8
};
class RenderState
{
    constructor(){
        this.lightmapScaleOffset= { x:1.0, y:1.0, z:0.0, w:0.0 };
		this.globalIlluminationUid=0;
    }
}
class Component {
    constructor()
	{
		this.uid=0;
		this.data_uid=0;
	}
	getType(){
		return NodeDataType.Invalid;
	}
  }
  
  
class MeshComponent extends Component
{
    constructor()
    {
		super();
		this.skeletonNodeID=0;
		this.renderState = new RenderState();
		this.url="";
    }
	getType() {
		return NodeDataType.Mesh;
	}
	encodeIntoDataView(dataView,byteOffset) {
		byteOffset=core.put_uint8(dataView,byteOffset,NodeDataType.Mesh);
		byteOffset=core.put_uint64(dataView,byteOffset,this.skeletonNodeID);

		var num_joint_indices=0;
		byteOffset=core.put_uint64(dataView,byteOffset,num_joint_indices);
		for (var i =0;i<num_joint_indices;i++)
		{
			var index=this.joint_indices[i];
			byteOffset=put_int16(dataView,byteOffset,index);
		}

		var num_animations=0;
		byteOffset=core.put_uint64(dataView,byteOffset,num_animations);
		for (var i =0;i<num_animations;i++)
		{
			byteOffset=core.put_uint64(dataView,byteOffset,this.animations[i]);
		}
		// If the node's priority is less than the *client's* minimum, we don't want
		// to send its mesh.
		if (this.data_type == nd.NodeDataType.Mesh)
		{
			byteOffset=core.put_uint64(dataView,byteOffset,num_materials);
			for (var i =0;i<num_materials;i++)
			{
				byteOffset=core.put_uint64(dataView,byteOffset,this.materials[i]);
			}
			byteOffset=core.put_vec4(dataView,byteOffset,this.renderState.lightmapScaleOffset);
			byteOffset=core.put_uint64(dataView,byteOffset,this.renderState.globalIlluminationUid);
		}
		return byteOffset;
	}
};
class SkeletonComponent extends Component
{
    constructor()
    {
		super();
    }
	getType(){
		return NodeDataType.Skeleton;
	}
};

class Node
{
    constructor(uid,name="")
    {
		this.uid=uid;
		this.name=name;
		this.pose=new Pose();
		this.parent_uid=0;
		this.data_type=NodeDataType.None;

		this.holder_client_id=0;
		this.stationary=true;

		this.priority=0;

		this.components = [];
    }
    static sizeof() {
        return 8+24+Pose.size+8;
    }
    size() {
        return Node.sizeof();
    }
	setMeshComponent(mesh_url){
		this.components.forEach(component => {
			if(component.getType()==NodeDataType.Mesh){
				component.meshUrl=mesh_url;
				return;
			}
		});
		var m=new MeshComponent();
		m.meshUrl=mesh_url;
		this.components.push(m);
	}
	encodeIntoDataView(dataView,byteOffset) {
		byteOffset=core.put_uint8(dataView,byteOffset,core.GeometryPayloadType.Node);

		byteOffset=core.put_uint64(dataView,byteOffset,this.uid);
		byteOffset=core.put_uint64(dataView,byteOffset,this.name.length);
		//Push name.
		for(var i=0;i<this.name.length;i++) {
			var char=this.name[i];
			var code=char.charCodeAt(0);
			byteOffset=core.put_uint8(dataView,byteOffset,code);
		}
		var clientsidePose=this.pose;
		//avs::ConvertTransform(serverSettings.serverAxesStandard, geometryStreamingService.getClientAxesStandard(), localTransform);
		byteOffset=clientsidePose.encodeIntoDataView(dataView,byteOffset);
		//put(node.localTransform);
		byteOffset=core.put_uint8(dataView,byteOffset,this.stationary);
		byteOffset=core.put_uint64(dataView,byteOffset,this.holder_client_id);
		byteOffset=core.put_int32(dataView,byteOffset,this.priority);
		byteOffset=core.put_uint64(dataView,byteOffset,this.parent_uid);

		// Data components. Let's say 8 bits for number of components.
		byteOffset=core.put_uint8(dataView,byteOffset,this.components.length);
		for(var i=0;i<this.components.length;i++) {
			byteOffset=this.components[i].encodeIntoDataView(dataView,byteOffset);
		}
		
		return byteOffset;
	/*
		if (this.data_type ==NodeDataType.Light)
		{
			put(this.lightColour);
			put(this.lightRadius);
			put(this.lightRange);
			vec3 lightDirection = this.lightDirection;
			avs::ConvertPosition(serverSettings.serverAxesStandard, geometryStreamingService.getClientAxesStandard(), lightDirection);
			put(lightDirection);
			put(this.lightType);
		}
		if (this.data_type == avs::NodeDataType::TextCanvas)
		{
			// nothing this-specific to add at present.
		}
		if (this.data_type == avs::NodeDataType::Skeleton)
		{
		}
		if (this.data_type == avs::NodeDataType::Link)
		{
			size_t urlLength = this.url.length();
			put(urlLength);
			put((uint8_t *)this.url.data(), urlLength);
			size_t queryLength = this.query_url.length();
			put(queryLength);
			put((uint8_t *)this.query_url.data(), queryLength);

		}*/
	}
};

module.exports = {NodeDataType,Pose,PoseDynamic,Node };
